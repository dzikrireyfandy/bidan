import db from '../db/pool';

export interface MasterConfig {
  table: string;
  pk: string;
  columns: readonly string[];
  orderBy?: string;
}

export class MasterRepository {
  constructor(private readonly config: MasterConfig) {}

  private validateColumn(column: string): string {
    if (!this.config.columns.includes(column)) {
      throw new Error(`Kolom tidak valid: ${column}`);
    }
    return column;
  }

  async list(limit: number, offset: number): Promise<Record<string, unknown>[]> {
    const order = this.validateColumn(this.config.orderBy ?? this.config.pk);
    const result = await db.query<Record<string, unknown>>(
      `SELECT * FROM ${this.config.table} ORDER BY ${order} OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`,
      { offset, limit }
    );
    return result.recordset;
  }

  async create(values: Record<string, unknown>): Promise<Record<string, unknown> | undefined> {
    const keys = Object.keys(values).map((key) => this.validateColumn(key));
    const columns = keys.join(', ');
    const params = keys.map((key) => `@${key}`).join(', ');
    const result = await db.query<Record<string, unknown>>(
      `INSERT INTO ${this.config.table} (${columns}) OUTPUT INSERTED.* VALUES (${params})`,
      values
    );
    return result.recordset[0];
  }

  async update(id: string, values: Record<string, unknown>): Promise<Record<string, unknown> | undefined> {
    const keys = Object.keys(values).map((key) => this.validateColumn(key));
    const assignments = keys.map((key) => `${key} = @${key}`).join(', ');
    const result = await db.query<Record<string, unknown>>(
      `UPDATE ${this.config.table} SET ${assignments} OUTPUT INSERTED.* WHERE ${this.config.pk} = @id`,
      { ...values, id }
    );
    return result.recordset[0];
  }
}

export default MasterRepository;
