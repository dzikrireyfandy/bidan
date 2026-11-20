export interface QueryRunner {
  query(text: string, params?: Record<string, unknown>): Promise<{ recordset: Record<string, unknown>[] }>;
}

/**
 * Basis repository generik untuk entitas CRUD sederhana.
 *
 * Sengaja dipertahankan sebagai API internal (dipakai oleh `tests/repository.test.ts`)
 * meskipun repository domain saat ini memakai SQL khusus per kebutuhan. Jangan
 * menambahkan query domain baru di sini; gunakan repository domain terkait.
 */
export abstract class BaseRepository<T, TCreate = Partial<T>, TUpdate = Partial<T>> {
  protected readonly db: QueryRunner;
  protected readonly table: string;
  protected readonly pk: string;
  protected readonly allowedColumns: readonly string[];

  constructor(db: QueryRunner, table: string, pk: string, allowedColumns: readonly string[] = []) {
    if (this.constructor === BaseRepository) {
      throw new Error('Abstract class BaseRepository cannot be instantiated directly');
    }
    this.db = db;
    this.table = table;
    this.pk = pk;
    this.allowedColumns = allowedColumns;
  }

  protected validateIdentifier(col: string): string {
    if (this.allowedColumns.length > 0 && !this.allowedColumns.includes(col)) {
      throw new Error(`Invalid identifier or column name: ${col}`);
    }
    return col;
  }

  protected abstract mapRow(row: Record<string, unknown>): T;

  async findById(id: string): Promise<T | null> {
    const query = `SELECT * FROM ${this.table} WHERE ${this.pk} = @id`;
    const result = await this.db.query(query, { id });
    if (result.recordset.length === 0) return null;
    return this.mapRow(result.recordset[0]!);
  }

  async findAll(opts?: { limit?: number; offset?: number; where?: Record<string, unknown> }): Promise<T[]> {
    const limit = opts?.limit ?? 100;
    const offset = opts?.offset ?? 0;
    const where = opts?.where ?? {};

    let query = `SELECT * FROM ${this.table}`;
    const params: Record<string, unknown> = {};
    const conditions: string[] = [];

    for (const [key, value] of Object.entries(where)) {
      const validCol = this.validateIdentifier(key);
      conditions.push(`${validCol} = @${validCol}`);
      params[validCol] = value;
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(' AND ');
    }

    query += ` ORDER BY ${this.pk} OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;
    params['offset'] = offset;
    params['limit'] = limit;

    const result = await this.db.query(query, params);
    return result.recordset.map(row => this.mapRow(row));
  }

  async create(entity: TCreate): Promise<T> {
    const keys = Object.keys(entity as object);
    keys.forEach(k => this.validateIdentifier(k));

    const columns = keys.join(', ');
    const values = keys.map(k => `@${k}`).join(', ');

    const query = `INSERT INTO ${this.table} (${columns}) OUTPUT INSERTED.* VALUES (${values})`;
    const result = await this.db.query(query, entity as Record<string, unknown>);
    return this.mapRow(result.recordset[0]!);
  }

  async update(id: string, patch: TUpdate): Promise<T | null> {
    const keys = Object.keys(patch as object);
    keys.forEach(k => this.validateIdentifier(k));

    const setClauses = keys.map(k => `${k} = @${k}`).join(', ');
    const query = `UPDATE ${this.table} SET ${setClauses} OUTPUT INSERTED.* WHERE ${this.pk} = @id`;

    const params: Record<string, unknown> = { ...(patch as object), id };
    const result = await this.db.query(query, params);
    if (result.recordset.length === 0) return null;
    return this.mapRow(result.recordset[0]!);
  }

  async remove(id: string): Promise<T | null> {
    const query = `DELETE FROM ${this.table} OUTPUT DELETED.* WHERE ${this.pk} = @id`;
    const result = await this.db.query(query, { id });
    if (result.recordset.length === 0) return null;
    return this.mapRow(result.recordset[0]!);
  }
}

export default BaseRepository;
