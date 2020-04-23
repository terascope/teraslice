import {
    DataEntity,
    Logger,
    TSError,
    chunk,
    pMap
} from '@terascope/utils';
import esApi, { Client } from '@terascope/elasticsearch-api';
import { ESStateStorageConfig, MGetCacheResponse } from '../interfaces';
import CachedStateStorage from '../cached-state-storage';

export default class ESCachedStateStorage {
    private index: string;
    private type: string;
    private concurrency: number;
    private sourceFields: string[];
    private chunkSize: number;
    private persist: boolean;
    private metaKey: string;
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
        this.metaKey = config.metaKey || '_key';
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

    getIdentifier(doc: DataEntity): string {
        const key = doc.getMetadata(this.metaKey);

        if (key === '' || key == null) {
            throw new TSError(`There is no field "${this.metaKey}" set in the metadata`, {
                context: { doc }
            });
        }

        return `${key}`;
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

    setCacheByKey(key: string|number, doc: DataEntity): void {
        return this.cache.set(key, doc);
    }

    getFromCache(doc: DataEntity) {
        const key = this.getIdentifier(doc);
        return this.getFromCacheByKey(key);
    }

    getFromCacheByKey(key: string|number) {
        return this.cache.get(key);
    }

    isCached(doc: DataEntity) {
        const key = this.getIdentifier(doc);
        return this.isKeyCached(key);
    }

    isKeyCached(key: string|number) {
        return this.cache.has(key);
    }

    async get(doc: DataEntity): Promise<DataEntity|undefined> {
        const key = this.getIdentifier(doc);
        const cached = this.getFromCacheByKey(key);
        if (cached) return cached;

        return this._esGet(key);
    }

    async mget(docArray: DataEntity[]): Promise<MGetCacheResponse> {
        const uniqKeys = this._dedupKeys(docArray);

        const uncached = this._getUncachedKeys(uniqKeys);

        const docsInEs = await this._getDocsFromEs(uncached);

        const savedDocs = this._createReturnObject(uniqKeys, docsInEs);

        this._logCacheStats(uniqKeys.length, uncached.length, docsInEs.length);

        return savedDocs;
    }

    private _dedupKeys(docArray: DataEntity[]) {
        const keys: { [propName: string]: any } = {};

        for (const doc of docArray) {
            const key = this.getIdentifier(doc);

            if (keys[key]) continue;
            else keys[key] = true;
        }

        return Object.keys(keys);
    }

    private _logCacheStats(incoming: number, uncached: number, inEs: number) {
        const hits = incoming - uncached;
        const misses = incoming - (uncached + inEs);
        this.logger.info(`elasticsearch-state-storage cache stats - incoming uniq keys: ${incoming}, hits: ${hits}, from es ${inEs}, misses: ${misses},`);
    }

    private _createReturnObject(keys: string[], docsInEs: DataEntity[]) {
        const savedDocs = docsInEs.reduce(
            (docObj: { [propName: string]: any }, doc: DataEntity) => {
                const key = this.getIdentifier(doc);
                docObj[key] = doc;

                return docObj;
            }, {}
        );

        for (const key of keys) {
            if (savedDocs[key]) continue;

            const cached = this.getFromCacheByKey(key);

            if (cached) {
                savedDocs[key] = cached;
            }
        }

        return savedDocs;
    }

    private async _getDocsFromEs(keyArray: string[]) {
        const esDocs = await pMap(
            chunk(keyArray, this.chunkSize),
            (chunked) => this._esMGet(chunked), { concurrency: this.concurrency }
        );

        return esDocs.reduce((concactedDocs: DataEntity[], esDocArray: DataEntity[]) => {
            for (const doc of esDocArray) {
                concactedDocs.push(doc);
            }

            return concactedDocs;
        }, []);
    }

    private _getUncachedKeys(keyArray: string[]): string[] {
        return keyArray.reduce((uncached: string[], key: string) => {
            if (this.isKeyCached(key) == null) {
                uncached.push(key);
            }

            return uncached;
        }, []);
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

    private async _esMGet(ids: string[]): Promise<DataEntity[]> {
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

        // mGet is getting the docs but then it also updates the cache
        const response: ESMGetResponse = await this.es.mget(request);

        const results: DataEntity[] = [];

        for (const result of response.docs) {
            if (result.found) {
                const saved = makeDataEntity(result);
                this.set(saved);
                results.push(saved);
            }
        }

        return results;
    }

    private _esBulkUpdatePrep(dataArray: DataEntity[]) {
        const bulkRequest: ESBulkQuery[] = [];

        for (const doc of dataArray) {
            bulkRequest.push({
                index: {
                    _index: this.index,
                    _type: this.type,
                    _id: this.getIdentifier(doc),
                },
            }, doc);
        }

        return bulkRequest;
    }

    private async _esBulkUpdate(docArray: DataEntity[]): Promise<void> {
        const chunked = chunk(docArray, this.chunkSize);

        await pMap(chunked, (chunkedData) => {
            const bulkRequest = this._esBulkUpdatePrep(chunkedData);
            return this.es.bulkSend(bulkRequest);
        }, {
            concurrency: this.concurrency
        });
    }
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
