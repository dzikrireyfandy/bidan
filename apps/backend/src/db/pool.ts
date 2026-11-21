import sql from 'mssql';
import config from '../config/env';
import { getAuditContext } from './auditContext';
import type { AuditContext } from './auditContext';

/** Selalu di-set di batch yang sama dengan query agar tidak mewarisi konteks koneksi pooled. */
const AUDIT_PREFIX = `EXEC sp_set_session_context N'akun_id', @__audit_akun;
EXEC sp_set_session_context N'user_ref', @__audit_user;
EXEC sp_set_session_context N'keterangan', @__audit_keterangan;
`;

export class SqlConnection {
  #pool: sql.ConnectionPool | null;
  #config: sql.config;

  constructor() {
    this.#config = {
      server: config.DB_SERVER,
      port: config.DB_PORT,
      database: config.DB_NAME,
      user: config.DB_USER,
      password: config.DB_PASSWORD,
      options: {
        encrypt: config.DB_ENCRYPT,
        trustServerCertificate: true
      },
      pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
      }
    };
    this.#pool = null;
  }

  async connect(): Promise<sql.ConnectionPool> {
    if (this.#pool && this.#pool.connected) {
      return this.#pool;
    }
    try {
      this.#pool = new sql.ConnectionPool(this.#config);
      await this.#pool.connect();
      return this.#pool;
    } catch (err) {
      this.#pool = null;
      throw err;
    }
  }

  // ponytail: tabel ber-trigger audit menolak OUTPUT tanpa INTO (SQL error 334),
  // jadi klausa OUTPUT ditulis ulang ke bentuk OUTPUT ... INTO + SELECT susulan.
  static readonly #outputClause = /OUTPUT\s+(INSERTED|DELETED)\.[\s\S]*?(?=\bVALUES\b|\bWHERE\b|;|$)/i;
  static readonly #targetTable = /(?:INSERT\s+INTO|UPDATE|DELETE\s+FROM)\s+(\[[^\]]+\]|[A-Za-z_][\w]*)/i;
  static readonly #pkCache = new Map<string, { pk: string; type: string } | null>();

  async #primaryKey(table: string): Promise<{ pk: string; type: string } | null> {
    const cached = SqlConnection.#pkCache.get(table);
    if (cached !== undefined) {
      return cached;
    }
    const pool = await this.connect();
    const result = await pool.request().input('t', table).query<{ COLUMN_NAME: string; DATA_TYPE: string }>(
      `SELECT TOP 1 c.COLUMN_NAME, c.DATA_TYPE
         FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
         JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE k
           ON k.CONSTRAINT_NAME = tc.CONSTRAINT_NAME AND k.TABLE_NAME = tc.TABLE_NAME
         JOIN INFORMATION_SCHEMA.COLUMNS c
           ON c.TABLE_NAME = k.TABLE_NAME AND c.COLUMN_NAME = k.COLUMN_NAME
        WHERE tc.CONSTRAINT_TYPE = 'PRIMARY KEY' AND tc.TABLE_NAME = @t
        ORDER BY k.ORDINAL_POSITION`
    );
    const row = result.recordset[0];
    const resolved = row ? { pk: row.COLUMN_NAME, type: mapType(row.DATA_TYPE) } : null;
    SqlConnection.#pkCache.set(table, resolved);
    return resolved;
  }

  async #rewriteOutput(text: string): Promise<string> {
    const output = text.match(SqlConnection.#outputClause);
    const target = text.match(SqlConnection.#targetTable);
    if (!output || !target) {
      return text;
    }
    const [, tableRaw = ''] = target;
    const table = tableRaw.replace(/^\[|\]$/g, '');
    const key = await this.#primaryKey(table);
    if (!key || table.length === 0) {
      return text;
    }
    const start = output.index ?? 0;
    const kind = (output[1] ?? 'INSERTED').toUpperCase();
    const rewritten =
      text.slice(0, start) +
      `OUTPUT ${kind}.${key.pk} INTO @__omo_ids ` +
      text.slice(start + output[0].length);
    return `DECLARE @__omo_ids TABLE (id ${key.type});\n${rewritten};\nSELECT * FROM [${table}] WHERE [${key.pk}] IN (SELECT id FROM @__omo_ids);`;
  }

  #applyAuditContext(request: sql.Request, context?: AuditContext): void {
    const ctx = context ?? getAuditContext();
    request.input('__audit_akun', sql.NVarChar(64), ctx.akunId ?? null);
    request.input('__audit_user', sql.NVarChar(100), ctx.userRef ?? null);
    request.input('__audit_keterangan', sql.NVarChar(200), ctx.keterangan ?? null);
  }

  async query<T>(text: string, params: Record<string, unknown> = {}, context?: AuditContext): Promise<sql.IResult<T>> {
    const pool = await this.connect();
    const request = pool.request();
    const statement = /OUTPUT\s+(?:INSERTED|DELETED)\./i.test(text) ? await this.#rewriteOutput(text) : text;
    this.#applyAuditContext(request, context);

    for (const [key, value] of Object.entries(params)) {
      request.input(key, value);
    }
    const result = await request.query<T>(AUDIT_PREFIX + statement);
    return result;
  }

  async execute<T>(procName: string, params: Record<string, unknown> = {}, context?: AuditContext): Promise<sql.IResult<T>> {
    const pool = await this.connect();
    const request = pool.request();
    this.#applyAuditContext(request, context);
    await request.batch(AUDIT_PREFIX);

    for (const [key, value] of Object.entries(params)) {
      request.input(key, value);
    }
    const result = await request.execute<T>(procName);
    return result;
  }

  async transaction<T>(fn: (tx: sql.Transaction) => Promise<T>): Promise<T> {
    const pool = await this.connect();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    try {
      const result = await fn(transaction);
      await transaction.commit();
      return result;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  async close(): Promise<void> {
    if (this.#pool) {
      await this.#pool.close();
      this.#pool = null;
    }
  }
}

function mapType(dataType: string): string {
  const map: Record<string, string> = {
    uniqueidentifier: 'UNIQUEIDENTIFIER',
    int: 'INT',
    bigint: 'BIGINT',
    smallint: 'SMALLINT',
    tinyint: 'TINYINT',
    bit: 'BIT',
    date: 'DATE',
    datetime: 'DATETIME',
    datetime2: 'DATETIME2'
  };
  return map[dataType.toLowerCase()] ?? 'NVARCHAR(200)';
}

const sqlConnection = new SqlConnection();
export default sqlConnection;
