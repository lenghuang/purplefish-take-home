export interface Filter {
  [key: string]: any;
}

export interface IRepository<T> {
  findById(id: string): Promise<T | null>;
  findAll(filter?: Filter): Promise<T[]>;
  create(entity: T): Promise<T>;
  update(id: string, entity: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}
