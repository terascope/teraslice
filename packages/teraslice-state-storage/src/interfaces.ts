import { DataEntity } from '@terascope/utils';

export interface ESStateStorageConfig extends CacheConfig {
    index: string;
    type: string;
    concurrency: number;
    source_fields: string[];
    chunk_size: number;
    persist: boolean;
    persist_field?: string;
}

interface ESMeta {
    _index: string;
    _type: string;
    _id: string;
}

export interface ESQuery {
    index: ESMeta;
}

export type ESBulkQuery = ESQuery | DataEntity;

export interface ESMGetParams {
    index: string;
    type: string;
    id?: string;
    body?: any;
    _sourceIncludes?: string[];
}

export interface ESGetParams {
    index: string;
    type: string;
    id: string;
    _sourceIncludes?: string[];
}

export interface CacheConfig {
    cache_size: number;
    max_big_map_size?: number;
}

export interface MGetCacheResponse {
    [key: string]: DataEntity;
}

export interface ESMGetResponse {
    docs: ESGetResponse[];
}

export interface ESGetResponse {
    _index: string;
    _type: string;
    _version: number;
    _id: string;
    found: boolean;
    _source?: any;
}

export type ValuesFn<T> = (doc: T) => void;

export interface EvictedEvent<T> {
    key: string;
    data: T;
}

export interface SetTuple<T> {
    key: string;
    data: T;
}
