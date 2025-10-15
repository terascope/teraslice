import { DataEntity } from '@terascope/utils';

export interface ESStateStorageConfig extends CacheConfig {
    index: string;
    concurrency: number;
    source_fields: string[];
    chunk_size: number;
    persist: boolean;
    meta_key_field: string;
}

export interface CacheConfig {
    cache_size: number;
    max_big_map_size?: number;
}

export interface MGetCacheResponse {
    [key: string]: DataEntity;
}

export type ValuesFn<T> = (doc: T) => void;

export interface EvictedEvent<T> {
    key: string;
    data: T;
}

export interface SetTuple<T> {
    key: string | number;
    data: T;
}
