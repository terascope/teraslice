import { IndexConfig } from 'elasticsearch-store';

export interface ManagerConfig {
    namespace: string;
    storeOptions?: Partial<IndexConfig>;
}
