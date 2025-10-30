export type {
    OpConfig, ExecutionConfig, JobConfig,
    SliceRequest, APIConfig, Slice, SliceAnalyticsData,
    ValidatedJobConfig, JobConfigParams, SysConfig,
    DeadLetterAction, DeadLetterAPIFn, Assignment,
    LifeCycle, Config as TerasliceConfig, ClusterManagerType
} from '@terascope/types';
import { DataEntity } from '@terascope/core-utils';

// this is an enum, cant export as type
export { RecoveryCleanupType } from '@terascope/types';

export type { CreateClientFactoryFn, ConnectionConfig, TerafoundationConfig } from '@terascope/types/dist/src/terafoundation.js';

// export type ConnectionConfig;

export interface APIFactoryRegistry<T, C> {
    get(name: string): T | undefined;
    getConfig(name: string): C | undefined;
    create(name: string, config: Partial<C>): Promise<T>;
    remove(name: string): Promise<void>;
    entries(): IterableIterator<[string, T]>;
    values(): IterableIterator<T>;
    keys(): IterableIterator<string>;
    size: number;
}

/**
 * Used for sending data to particular index/topic/file/table in a storage system.
 * This is used by the routed sender in the standard-assets
*/
export interface RouteSenderAPI {
    /**
     * Sends the records to the respective storage backend
     *
     * @returns the number of affected records/rows
    */
    send(records: Iterable<DataEntity>): Promise<number>;

    /**
     * This is used to verify and create an resources
     * required for this particular route
     *
     * This is optional to implement
    */
    verify?(route?: string): Promise<void>;
}
