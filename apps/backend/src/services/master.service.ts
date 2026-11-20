import ApiError from '../errors/ApiError';
import { paginate } from '../validation/common';
import MasterRepository from '../repositories/master.repository';
import type { MasterDefinition } from '../validation/master';

export class MasterService {
  private readonly repository: MasterRepository;

  constructor(private readonly definition: MasterDefinition) {
    this.repository = new MasterRepository(definition.config);
  }

  list(limit?: number, offset?: number): Promise<Record<string, unknown>[]> {
    return this.repository.list(paginate(limit, 100, 500), offset ?? 0);
  }

  create(body: Record<string, unknown>): Promise<Record<string, unknown> | undefined> {
    const values = this.pick(body);
    if (Object.keys(values).length === 0) {
      throw ApiError.validation('Body tidak berisi kolom yang valid');
    }
    return this.repository.create(values);
  }

  async update(id: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
    const values = this.pick(body);
    if (Object.keys(values).length === 0) {
      throw ApiError.validation('Tidak ada perubahan');
    }
    const row = await this.repository.update(id, values);
    if (!row) {
      throw ApiError.notFound('Data tidak ditemukan');
    }
    return row;
  }

  private pick(body: Record<string, unknown>): Record<string, unknown> {
    const values: Record<string, unknown> = {};
    for (const column of this.definition.config.columns) {
      if (body[column] !== undefined) {
        values[column] = body[column];
      }
    }
    return values;
  }
}

export default MasterService;
