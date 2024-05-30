export type {
    OpConfig, ExecutionConfig, JobConfig,
    SliceRequest, APIConfig, Slice, SliceAnalyticsData,
    ValidatedJobConfig, JobConfigParams, SysConfig,
    DeadLetterAction, DeadLetterAPIFn, Assignment,
    LifeCycle, Config as TerasliceConfig, ClusterManagerType
} from '@terascope/types';

// this is an enum, cant export as type
export { RecoveryCleanupType } from '@terascope/types';

export type { CreateClientFactoryFn, ConnectionConfig, TerafoundationConfig } from '@terascope/types/dist/src/terafoundation.js';

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
