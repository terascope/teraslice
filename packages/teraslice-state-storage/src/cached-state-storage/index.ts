
import LRU from 'lru-cache';
import { DataEntity, TSError } from '@terascope/job-components';
import { CacheConfig, MGetCacheResponse } from '../interfaces';

export default class CachedStateStorage {
    protected IDField: string;
    private cache: LRU<string, DataEntity>;

    constructor(config: CacheConfig) {
        this.IDField = config.id_field;
        this.cache = new LRU({
            max: config.cache_size,
            maxAge: config.max_age
        });
    }

    private getIdentifier(doc: DataEntity) {
        const id =  doc.getMetadata(this.IDField);
        if (id == null) throw new TSError(`There is no field "${this.IDField}" set in the metadata for doc: ${JSON.stringify(doc)}`);
        return id;
    }

    get(doc: DataEntity): DataEntity<object>|undefined {
        const identifier = this.getIdentifier(doc);
        return this.cache.get(identifier);
    }

    mget(docArray: DataEntity[]): MGetCacheResponse {
        return docArray.reduce((cachedState, doc) => {
            const identifier = this.getIdentifier(doc);
            const state = this.cache.get(identifier);
            if (state) cachedState[identifier] = state;
            return cachedState;
        }, {});
    }

    set(doc: DataEntity) {
        const identifier = this.getIdentifier(doc);
        this.cache.set(identifier, doc);
    }

    mset(docArray: DataEntity[]) {
        docArray.forEach(doc => this.set(doc));
    }

    delete(doc: DataEntity) {
        const identifier = this.getIdentifier(doc);
        this.cache.del(identifier);
    }

    mdelete(docArray: DataEntity[]) {
        docArray.forEach(doc => this.delete(doc));
    }

    count() {
        return this.cache.itemCount;
    }

    has(doc: DataEntity) {
        const identifier = this.getIdentifier(doc);
        return this.cache.has(identifier);
    }

    initialize() {}

    shutdown() {
        this.cache.reset();
    }
}
