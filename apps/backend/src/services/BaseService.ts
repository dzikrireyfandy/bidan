import ApiError from '../errors/ApiError';

export interface ReadRepository<T> {
  findById(id: string): Promise<T | null>;
}

export class BaseService<T> {
  protected readonly repository: ReadRepository<T>;

  constructor(repository: ReadRepository<T>) {
    this.repository = repository;
  }

  async getOrThrow(id: string, errorMessage = 'Resource not found'): Promise<T> {
    const entity = await this.repository.findById(id);
    if (!entity) {
      throw ApiError.notFound(errorMessage);
    }
    return entity;
  }
}

export default BaseService;
