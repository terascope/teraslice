export type {
    OpConfig, ExecutionConfig, JobConfig,
    SliceRequest, APIConfig, Slice, SliceAnalyticsData,
    ValidatedJobConfig, JobConfigParams, SysConfig,
    DeadLetterAction, DeadLetterAPIFn, Assignment

} from '@terascope/types';

export type { CreateClientFactoryFn, ConnectionConfig } from '@terascope/types/dist/src/terafoundation.js';

// export type ConnectionConfig;

export interface APIFactoryRegistry<T, C> {
    get(name: string): T|undefined;
    getConfig(name: string): C|undefined;
    create(name: string, config: Partial<C>): Promise<T>;
    remove(name: string): Promise<void>;
    entries(): IterableIterator<[string, T]>;
    values(): IterableIterator<T>;
    keys(): IterableIterator<string>;
    size: number;
}
