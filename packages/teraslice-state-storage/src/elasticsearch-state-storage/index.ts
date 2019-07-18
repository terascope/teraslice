
import { DataEntity, Logger, TSError, chunk } from '@terascope/job-components';
import esApi, { Client } from '@terascope/elasticsearch-api';
import { Promise as bPromise } from 'bluebird';
import { ESStateStorageConfig, ESBulkQuery, ESQUery, MGetResponse } from '../interfaces';
import CachedStateStorage from '../cached-state-storage';

export default class ESCachedStateStorage {
    private index: string;
    private type: string;
    private IDField: string;
    private concurrency: number;
    private sourceFields: string[];
    private chunkSize: number;
    private persist: boolean;
    private persistField: string;
    private es: Client;
    public cache: CachedStateStorage<DataEntity>;

    constructor(client: Client, logger: Logger, config: ESStateStorageConfig) {
        this.index = config.index;
        this.type = config.type;
        this.IDField = '_key';
        this.concurrency = config.concurrency;
        this.sourceFields = config.source_fields || [];
        this.chunkSize = config.chunk_size;
        this.persist = config.persist;
        this.persistField = config.persist_field || this.IDField;
        this.cache = new CachedStateStorage(config);
        this.es = esApi(client, logger);
    }

    private getIdentifier(doc: DataEntity) {
        const id =  doc.getMetadata(this.IDField);
        if (id === '' || id == null) {
            throw new TSError(`There is no field "${this.IDField}" set in the metadata`, { context: { doc } });
        }
        return id;
    }

    private _esBulkUpdatePrep(dataArray: DataEntity[]) {
        const bulkRequest: ESBulkQuery[] = [];

        dataArray.forEach((item) => {
            const id = item.getMetadata(this.persistField);
            bulkRequest.push({
                index: {
                    _index: this.index,
                    _type: this.type,
                    _id: id
                }
            });
            bulkRequest.push(item);
        });

        return bulkRequest;
    }

    private _esBulkUpdate(docArray: DataEntity[]) {
        const bulkRequest = this._esBulkUpdatePrep(docArray);
        const chunkedArray = chunk<ESBulkQuery>(bulkRequest, this.chunkSize);
        return bPromise.map<ESBulkQuery[], ESBulkQuery[]>(chunkedArray, chunkedData => this.es.bulkSend(chunkedData));
    }

    private async _esGet(doc: DataEntity) {
        const id = this.getIdentifier(doc);
        const request = {
            index: this.index,
            type: this.type,
            id
        };

        const results = await this.es.get(request);
        return DataEntity.make(results, { [this.IDField]: id });
    }

    private async _esMget(query: string[]) {
        const request: ESQUery = {
            index: this.index,
            type: this.type,
            body: {
                ids: query
            }
        };
        if (this.sourceFields.length > 0) request._source = this.sourceFields;
        const response: MGetResponse = await this.es.mget(request);

        return response.docs
            .filter(doc => doc.found)
            .map(doc => DataEntity.make(doc._source, { [this.IDField]: doc._id }));

    }

    getFromCache(doc: DataEntity) {
        const indentifier = this.getIdentifier(doc);
        return this.cache.get(indentifier);
    }

    isCached(doc: DataEntity) {
        const indentifier = this.getIdentifier(doc);
        return this.cache.has(indentifier);
    }

    async get(doc: DataEntity) {
        const cached = this.getFromCache(doc);
        if (cached) return cached;
        const results = await this._esGet(doc);
        this.set(results);
        return results;
    }

    async mget(docArray: DataEntity[], mapperFn = (doc: DataEntity) => doc) {
        const savedDocs = {};
        const unCachedDocKeys: string[] = [];
        // need to add valid docs to return object and find non-cached docs
        docArray.forEach((doc) => {
            const key = this.getIdentifier(doc);
            const cachedDoc = this.cache.get(key);

            if (cachedDoc) {
                savedDocs[key] = cachedDoc;
                return;
            }

            if (key) {
                unCachedDocKeys.push(key);
            }
        });

        const chunkedArray = chunk<string>(unCachedDocKeys, this.chunkSize);
        // es search for keys not in cache
        const mgetResults = await bPromise.map<string[], DataEntity[]>(
            chunkedArray,
            chunked => this._esMget(chunked),
            { concurrency: this.concurrency }
        );

        // update cache based on mget results
        mgetResults.forEach((results) => {
            results.forEach((doc: DataEntity) => {
                const data = mapperFn(doc);
                // update cache
                this.set(data);
                // updated savedDocs object
                savedDocs[this.getIdentifier(data)] = data;
            });
        });

        return savedDocs;
    }

    set(doc: DataEntity) {
        // update cache, if persistance is needed use mset
        const identifier = this.getIdentifier(doc);
        return this.cache.set(identifier, doc);
    }

    async mset(docArray: DataEntity[]) {
        const formattedDocs = docArray.map((doc) => ({ data: doc, key: this.getIdentifier(doc) }));
        if (this.persist) {
            const [results] = await bPromise.all([this.cache.mset(formattedDocs), this._esBulkUpdate(docArray)]);
            return results;
        }
        return this.cache.mset(formattedDocs);
    }

    count() {
        return this.cache.count();
    }

    async initialize() {
        this.cache.initialize();
    }

    async shutdown() {
        this.cache.clear();
    }

}
