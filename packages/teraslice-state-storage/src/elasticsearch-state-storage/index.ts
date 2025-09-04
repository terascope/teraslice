import {
    DataEntity, Logger, TSError,
    chunk, pMap
} from '@terascope/utils';
import { ClientParams, ClientResponse } from '@terascope/types';
import esApi from '@terascope/elasticsearch-api';
import { ESStateStorageConfig, MGetCacheResponse } from '../interfaces.js';
import CachedStateStorage from '../cached-state-storage/index.js';

export default class ESCachedStateStorage {
    private index: string;
    private concurrency: number;
    private sourceFields: string[];
    private chunkSize: number;
    private persist: boolean;
    private metaKey: string;
    private es: esApi.Client;
    private logger: Logger;
    public cache: CachedStateStorage<DataEntity>;

    constructor(client: esApi.Client, logger: Logger, config: ESStateStorageConfig) {
        this.index = config.index;
        this.concurrency = config.concurrency;
        this.sourceFields = config.source_fields || [];
        this.chunkSize = config.chunk_size;
        this.persist = config.persist;
        this.metaKey = config.meta_key_field || '_key';
        this.cache = new CachedStateStorage(config);
        this.logger = logger;
        this.es = esApi(client, logger);
    }

    async initialize(): Promise<void> {}

    async shutdown(): Promise<void> {
        this.cache.clear();
    }

    count(): number {
        return this.cache.count();
    }

    getIdentifier(doc: DataEntity, metaField = this.metaKey): string {
        const key = doc.getMetadata(metaField);

        if (key === '' || key == null) {
            throw new TSError(`There is no field "${this.metaKey}" set in the metadata`, {
                context: { doc }
            });
        }

        return `${key}`;
    }

    async mset(docArray: DataEntity[]) {
        const formattedDocs = docArray.map((doc) => ({ data: doc, key: this.getIdentifier(doc, '_key') }));

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
        const key = this.getIdentifier(doc, '_key');
        return this.setCacheByKey(key, doc);
    }

    setCacheByKey(key: string | number, doc: DataEntity): void {
        return this.cache.set(key, doc);
    }

    getFromCache(doc: DataEntity): DataEntity | undefined {
        const key = this.getIdentifier(doc);
        return this.getFromCacheByKey(key);
    }

    getFromCacheByKey(key: string | number): DataEntity | undefined {
        return this.cache.get(key);
    }

    isCached(doc: DataEntity): boolean {
        const key = this.getIdentifier(doc);
        return this.isKeyCached(key);
    }

    isKeyCached(key: string | number): boolean {
        return this.cache.has(key);
    }

    async get(doc: DataEntity): Promise<DataEntity | undefined> {
        const key = this.getIdentifier(doc);
        const cached = this.getFromCacheByKey(key);
        if (cached) return cached;

        return this._esGet(key);
    }

    async mget(docArray: DataEntity[]): Promise<MGetCacheResponse> {
        if (docArray.length === 0) return {};

        const beginingCacheCount = this.cache.count();

        const uniqKeys = this._getUniqKeys(docArray);

        // first get docs in cache to avoid premature key eviction
        const found: { [propName: string]: any } = {};

        const uncachedKeys = this._separateCachedKeysFromUncached(uniqKeys, found);

        await this._updateCacheFoundWithEs(uncachedKeys, found);

        this._logCacheStats(
            {
                beginingCacheCount,
                incoming: docArray.length,
                uniqIncoming: uniqKeys.length,
                notInMemory: uncachedKeys.length,
                found: Object.keys(found).length
            }
        );

        return found;
    }

    private _getUniqKeys(docArray: DataEntity[]): string[] {
        const keys: { [propName: string]: boolean } = {};

        for (const doc of docArray) {
            const key = this.getIdentifier(doc);

            if (keys[key]) continue;
            else keys[key] = true;
        }

        return Object.keys(keys);
    }

    private _separateCachedKeysFromUncached(
        uniqKeys: string[],
        found: { [propName: string]: any }
    ): string[] {
        return uniqKeys.filter((key) => {
            const doc = this.getFromCacheByKey(key);

            if (doc == null) return true;

            found[key] = doc;

            return false;
        });
    }

    private _logCacheStats(cacheResults: CacheResults) {
        const inMemory = cacheResults.uniqIncoming - cacheResults.notInMemory;
        const inEs = cacheResults.found - inMemory;
        const misses = cacheResults.uniqIncoming - cacheResults.found;

        this.logger.info(`elasticsearch-state-storage cache results -
            ending cache count: ${this.cache.count()},
            beginning cache count: ${cacheResults.beginingCacheCount},
            uniq incoming: ${cacheResults.uniqIncoming},
            found in memory: ${inMemory},
            found es: ${inEs},
            missed: ${misses}`);
    }

    private async _updateCacheFoundWithEs(keyArray: string[], found: { [propName: string]: any }) {
        const esResponse = await this._concurrentEsMget(keyArray);

        for (const response of esResponse) {
            response.forEach((doc) => {
                const key = this.getIdentifier(doc, '_key');
                found[key] = doc;
                this.setCacheByKey(key, doc);
            });
        }
    }

    private async _esGet(key: string): Promise<DataEntity | undefined> {
        const request: ClientParams.GetParams = {
            index: this.index,
            id: key
        };

        if (this.sourceFields.length > 0) {
            request._source_includes = this.sourceFields;
        }

        const response = await this.es.get(request, true);
        if (!response || !response.found) return undefined;

        const updated = makeDataEntity(response);
        this.setCacheByKey(key, updated);
        return updated;
    }

    private _concurrentEsMget(keyArray: string[]): Promise<DataEntity[][]> {
        return pMap(
            chunk(keyArray, this.chunkSize),
            (chunked) => this._esMGet(chunked),
            { concurrency: this.concurrency }
        );
    }

    private async _esMGet(ids: string[]): Promise<DataEntity[]> {
        const request: ClientParams.MGetParams = {
            index: this.index,
            body: {
                ids,
            },
        };

        if (this.sourceFields.length > 0) {
            request._source_includes = this.sourceFields;
        }

        return this.es.mget(request);
    }

    private _esBulkUpdatePrep(dataArray: DataEntity[]): esApi.BulkRecord[] {
        return dataArray.map((doc) => ({
            action: {
                index: {
                    _index: this.index,
                    _id: this.getIdentifier(doc, '_key'),
                },
            },
            data: doc
        }));
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

function makeDataEntity(result: ClientResponse.GetResponse): DataEntity {
    const key = result._id;

    return DataEntity.make(result._source as any, {
        _key: key,
        _processTime: Date.now(),
        // TODO Add event and ingest time
        _index: result._index,
        _version: result._version,
    });
}

interface CacheResults {
    beginingCacheCount: number;
    incoming: number;
    uniqIncoming: number;
    notInMemory: number;
    found: number;
}
