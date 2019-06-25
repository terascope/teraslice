
import { DataEntity } from '@terascope/job-components';

export interface ESStateStorageConfig extends CacheConfig {
    index: string;
    type: string;
    concurrency: number;
    source_fields: string[];
    chunk_size: number;
    persist: boolean;
    persist_field: string;
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

export interface ESQUery {
    index: string;
    type: string;
    id?: string;
    body?: any;
    _source?: string[];
}

export interface CacheConfig {
    id_field: string;
    cache_size: number;
    max_age: number;
}

export interface MGetCacheResponse {
    [key: string]: DataEntity;
}

export interface MGetResponse {
    docs: MGetDoc[];
}

export interface MGetDoc {
    _index: string;
    _type: string;
    _version: number;
    _id: string;
    found: boolean;
    _source?: any;
}
