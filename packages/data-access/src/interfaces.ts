import { IndexConfig } from 'elasticsearch-store';
import { Logger } from '@terascope/utils';

export interface ManagerConfig {
    namespace: string;
    storeOptions?: Partial<IndexConfig>;
    logger?: Logger;
}
