
import { DataEntity, Logger } from '@terascope/job-components';
import esApi, { Client } from '@terascope/elasticsearch-api';
import { Promise as bPromise } from 'bluebird';
import { ESStateStorageConfig, ESBulkQuery, ESQUery } from '../interfaces';
import CachedStateStorage from '../cached-state-storage';

export default class ESCacheStateStorage {
    private index: string;
    private type: string;
    private IDField: string;
    private concurrency: number;
    private sourceFields: string[];
    private chunkSize: number;
    private persist: boolean;
    private persistField: string;
    private es: Client;
    private cache: CachedStateStorage;

    constructor(client: Client, logger: Logger, config: ESStateStorageConfig) {
        this.index = config.index;
        this.type = config.type;
        this.IDField = config.id_field;
        this.concurrency = config.concurrency;
        this.sourceFields = config.source_fields;
        this.chunkSize = config.chunk_size;
        this.persist = config.persist;
        this.persistField = config.persist_field;
        this.cache = new CachedStateStorage(config);
        this.es = esApi(client, logger);
    }

    private _esBulkUpdatePrep(dataArray: DataEntity[]) {
        const bulkRequest: ESBulkQuery[] = [];

        dataArray.forEach((item) => {
            bulkRequest.push({
                index: {
                    _index: this.index,
                    _type: this.type,
                    _id: item[this.persistField]
                }
            });
            bulkRequest.push(item);
        });

        return bulkRequest;
    }

    private _esBulkUpdate(docArray: DataEntity[]) {
        const bulkRequest = this._esBulkUpdatePrep(docArray);

        return bPromise.map(chunk<ESBulkQuery>(bulkRequest, this.chunkSize),
            chunkedData => this.es.bulkSend(chunkedData)
            );
    }

    private _esGet(doc: DataEntity) {
        const request = {
            index: this.index,
            type: this.type,
            id: doc[this.IDField]
        };

        return this.es.get(request);
    }

    private _esMget(query: string[]) {
        const request: ESQUery = {
            index: this.index,
            type: this.type,
            body: {
                ids: query
            }
        };
        if (this.sourceFields.length > 0) request._source = this.sourceFields;
        return this.es.mget(request);
    }

    private _dedupeDocs(docArray: DataEntity[], idField = this.IDField) {
        // returns uniq docs from an array of docs
        const uniqKeys = {};
        return docArray.filter((doc) => {
            const id = doc[idField];
            const uniq = has(uniqKeys, id) ? false : uniqKeys[id] = true;
            return uniq;
        });
    }

    async get(doc: DataEntity) {
        let cached = this.cache.get(doc);
        if (!cached && doc[this.IDField]) {
            cached = await this._esGet(doc);
        }
        return cached;
    }

    async mget(docArray: DataEntity[]) {
        // dedupe docs
        const uniqDocs = this._dedupeDocs(docArray);

        const savedDocs = {};
        const unCachedDocKeys: string[] = [];

        // need to add valid docs to return object and find non-cached docs
        uniqDocs.forEach((doc) => {
            const key = doc[this.IDField];
            const cachedDoc = this.cache.get(doc);

            if (cachedDoc) {
                savedDocs[key] = cachedDoc;
                return;
            }

            if (key) {
                unCachedDocKeys.push(key);
            }
        });

        // es search for keys not in cache
        const mgetResults = await bPromise.map(chunk<string>(unCachedDocKeys, this.chunkSize),
            chunked => this._esMget(chunked), { concurrency: this.concurrency });

        // update cache based on mget results
        mgetResults.forEach((result) => {
            // FIXME: should not be any
            result.docs.forEach((doc: any) => {
                if (doc.found) {
                    // need to set id field in doc
                    doc._source[this.IDField] = doc._id;

                    // update cache
                    this.set(doc._source);

                    // updated savedDocs object
                    savedDocs[doc._id] = doc._source;
                }
            });
        });
        // return state
        return savedDocs;
    }

    async set(doc: DataEntity) {
        // update cache, if persistance is needed use mset
        return this.cache.set(doc);
    }

    async mset(docArray: DataEntity[], keyField: string) {
        const dedupedDocs = this._dedupeDocs(docArray, keyField);
        if (this.persist) {
            return bPromise.all([this.cache.mset(dedupedDocs), this._esBulkUpdate(dedupedDocs)]);
        }
        return this.cache.mset(dedupedDocs);
    }

    async initialize() {
        this.cache.initialize();
    }

    async shutdown() {
        this.cache.shutdown();
    }

}

function has(data: object, key: any) {
    return key in data;
}

function chunk<T>(dataArray: T[], size:number) {
    if (size < 1) return [dataArray];
    const results: T[][] = [];
    let chunked: T[] = [];

    for (let i = 0; i < dataArray.length; i += 1) {
        chunked.push(dataArray[i]);
        if (chunked.length === size) {
            results.push(chunked);
            chunked = [];
        }
    }

    if (chunked.length > 0) results.push(chunked);
    return results;
}
