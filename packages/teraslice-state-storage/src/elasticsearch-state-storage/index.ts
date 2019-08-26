import {
    DataEntity, Logger, TSError, chunk, isFunction, pImmediate
} from '@terascope/utils';
import esApi, { Client } from '@terascope/elasticsearch-api';
import { Promise as bPromise } from 'bluebird';
import { ESStateStorageConfig, MGetCacheResponse } from '../interfaces';
import CachedStateStorage from '../cached-state-storage';

export default class ESCachedStateStorage {
    private index: string;
    private type: string;
    private concurrency: number;
    private sourceFields: string[];
    private chunkSize: number;
    private persist: boolean;
    private persistField?: string;
    private es: Client;
    private logger: Logger;
    public cache: CachedStateStorage<DataEntity>;

    constructor(client: Client, logger: Logger, config: ESStateStorageConfig) {
        this.index = config.index;
        this.type = config.type;
        this.concurrency = config.concurrency;
        this.sourceFields = config.source_fields || [];
        this.chunkSize = config.chunk_size;
        this.persist = config.persist;
        if (config.persist_field && config.persist_field !== '_key') {
            this.persistField = config.persist_field;
        }
        this.cache = new CachedStateStorage(config);
        this.logger = logger;
        this.es = esApi(client, logger);
    }

    async initialize() {}

    async shutdown() {
        this.cache.clear();
    }

    count(): number {
        return this.cache.count();
    }

    getIdentifier(doc: DataEntity, metaKey: string = '_key'): string {
        const key = doc.getMetadata(metaKey);
        if (key === '' || key == null) {
            throw new TSError(`There is no field "${metaKey}" set in the metadata`, {
                context: { doc }
            });
        }
        return key;
    }

    async mset(docArray: DataEntity[]) {
        const formattedDocs = docArray.map((doc) => ({ data: doc, key: this.getIdentifier(doc) }));
        if (this.persist) {
            const [results] = await Promise.all([
                this.cache.mset(formattedDocs),
                this._esBulkUpdate(docArray)
            ]);
            return results;
        }
        return this.cache.mset(formattedDocs);
    }

    set(doc: DataEntity): void {
        // update cache, if persistance is needed use mset
        const key = this.getIdentifier(doc);
        return this.setCacheByKey(key, doc);
    }

    setCacheByKey(key: string, doc: DataEntity): void {
        return this.cache.set(key, doc);
    }

    getFromCache(doc: DataEntity) {
        const key = this.getIdentifier(doc);
        return this.getFromCacheByKey(key);
    }

    getFromCacheByKey(key: string) {
        return this.cache.get(key);
    }

    isCached(doc: DataEntity) {
        const key = this.getIdentifier(doc);
        return this.isKeyCached(key);
    }

    isKeyCached(key: string) {
        return this.cache.has(key);
    }

    async get(doc: DataEntity): Promise<DataEntity|undefined> {
        const key = this.getIdentifier(doc);
        const cached = this.getFromCacheByKey(key);
        if (cached) return cached;

        return this._esGet(key);
    }

    async mget(docArray: DataEntity[]): Promise<MGetCacheResponse> {
        const savedDocs = {};
        const setDocs: UpdateCacheFn = (key, current, prev) => {
            if (prev) savedDocs[key] = prev;
            return prev || current;
        };

        await this.sync(docArray, setDocs);
        return savedDocs;
    }

    async sync(docArray: DataEntity[], fn: UpdateCacheFn): Promise<void> {
        if (!docArray || !Array.isArray(docArray)) {
            throw new Error('Invalid docs given to sync, expected Array');
        }

        if (!fn || !isFunction(fn)) {
            throw new Error('Invalid function given to sync');
        }
        if (!docArray.length) return;

        const { uncached, duplicates } = this._updateCache(docArray, fn);
        if (uncached.length) {
            // es search for keys not in cache
            await bPromise.map(uncached, (chunked) => this._esMGet(chunked, fn), {
                concurrency: this.concurrency
            });
        }

        if (duplicates.length) {
            await pImmediate();
            this.logger.info(`syncing the remaining ${duplicates.length} duplicate records`);
            return this.sync(duplicates, fn);
        }
    }

    private _updateCache(docArray: DataEntity[], fn: UpdateCacheFn): { uncached: UncachedChunks; duplicates: DataEntity[] } {
        const duplicates: DataEntity[] = [];
        const found: { [key: string]: true } = {};
        const uncachedChunks: UncachedChunks = [];
        let hits = 0;
        const missesPerChunk: number[] = [];
        let uncachedIndex = 0;

        for (const current of docArray) {
            if (current == null) continue;

            const key = this.getIdentifier(current);
            const prev = this.getFromCacheByKey(key);
            if (found[key]) {
                duplicates.push(current);
                continue;
            }
            found[key] = true;

            if (prev) {
                hits++;
                this._updateCacheWith(fn, key, current, prev);
            } else {
                if (missesPerChunk[uncachedIndex] != null
                    && missesPerChunk[uncachedIndex] >= this.chunkSize) {
                    uncachedIndex++;
                }
                if (missesPerChunk[uncachedIndex] == null) {
                    missesPerChunk.push(0);
                }
                if (uncachedChunks[uncachedIndex] == null) {
                    uncachedChunks.push({});
                }

                uncachedChunks[uncachedIndex][key] = current;
                missesPerChunk[uncachedIndex]++;
            }
        }

        const misses = missesPerChunk.reduce((total, current) => total + current, 0);
        this.logger.info(`elasticsearch-state-storage cache hits: ${hits}, cache misses: ${misses}, duplicates: ${duplicates.length}`);

        return {
            uncached: uncachedChunks,
            duplicates,
        };
    }

    private async _esGet(key: string): Promise<DataEntity|undefined> {
        const request: ESGetParams = {
            index: this.index,
            type: this.type,
            id: key
        };

        if (this.sourceFields.length > 0) {
            request._sourceIncludes = this.sourceFields;
        }

        const response = await this.es.get(request, true);
        if (!response || !response.found) return undefined;

        const updated = makeDataEntity(response);
        this.setCacheByKey(key, updated);
        return updated;
    }

    private async _esMGet(docs: DataEntityObj, fn: UpdateCacheFn): Promise<DataEntity[]> {
        const ids = Object.keys(docs);
        const request: ESMGetParams = {
            index: this.index,
            type: this.type,
            body: {
                ids,
            },
        };
        if (this.sourceFields.length > 0) {
            request._sourceIncludes = this.sourceFields;
        }
        const response: ESMGetResponse = await this.es.mget(request);

        const results: DataEntity[] = [];
        for (const result of response.docs) {
            const key = result._id;
            let prev: DataEntity|undefined;
            if (result.found) {
                prev = makeDataEntity(result);
                results.push(prev);
            }
            const current = docs[key];
            if (current) {
                this._updateCacheWith(fn, key, current, prev);
            }
        }
        return results;
    }

    private _esBulkUpdatePrep(dataArray: DataEntity[]) {
        const bulkRequest: ESBulkQuery[] = [];

        for (const doc of dataArray) {
            let key: string;
            if (this.persistField) {
                key = this.getIdentifier(doc, this.persistField);
            } else {
                key = this.getIdentifier(doc);
            }
            bulkRequest.push({
                index: {
                    _index: this.index,
                    _type: this.type,
                    _id: key,
                },
            }, doc);
        }

        return bulkRequest;
    }

    private _updateCacheWith(fn: UpdateCacheFn, key: string, current: DataEntity, prev?: DataEntity) {
        const result = fn(key, current, prev);
        if (result === false) return;
        if (result == null || result === true) {
            this.setCacheByKey(key, current);
            return;
        }
        if (result) {
            this.setCacheByKey(key, result);
        }
    }

    private async _esBulkUpdate(docArray: DataEntity[]): Promise<void> {
        const chunked = chunk(docArray, this.chunkSize);

        await bPromise.map(chunked, (chunkedData) => {
            const bulkRequest = this._esBulkUpdatePrep(chunkedData);
            return this.es.bulkSend(bulkRequest);
        }, {
            concurrency: this.concurrency
        });
    }
}

export type UpdateCacheFn = (key: string, current: DataEntity, prev?: DataEntity) => DataEntity|boolean;

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

type DataEntityObj = { [key: string]: DataEntity };
type UncachedChunks = DataEntityObj[];

function makeDataEntity(result: ESGetResponse): DataEntity {
    const key = result._id;
    return DataEntity.make(result._source, {
        _key: key,
        _processTime: Date.now(),
        // TODO Add event and ingest time
        _index: result._index,
        _type: result._type,
        _version: result._version,
    });
}
