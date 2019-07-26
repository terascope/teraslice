
import LRU from 'mnemonist/lru-map';
import { promisify } from 'util';
import { EventEmitter } from 'events';

import {
    CacheConfig,
    MGetCacheResponse,
    SetTuple,
    ValuesFn,
    EvictedEvent
} from '../interfaces';

const immediate = promisify(setImmediate);

export default class CachedStateStorage<T> extends EventEmitter {
    protected IDField: string;
    private _cache: LRU<string, T>;

    constructor(config: CacheConfig) {
        super();
        this.IDField = '_key';
        this._cache = new LRU(config.cache_size);
    }

    get(key: string): T | undefined {
        return this._cache.get(key);
    }

    mget(keyArray: string[]): MGetCacheResponse {
        return keyArray.reduce((cachedState, key) => {
            const state = this.get(key);
            if (state) cachedState[key] = state;
            return cachedState;
        }, {});
    }

    set(key: string, value: T) {
        const results = this._cache.setpop(key, value);
        if (results && results.evicted) this.emit('eviction', { key: results.key, data: results.value } as EvictedEvent<T>);
    }

    mset(docArray: SetTuple<T>[]) {
        docArray.forEach(doc => this.set(doc.key, doc.data));
    }

    count() {
        return this._cache.size;
    }

    async values(fn: ValuesFn<T>) {
        let i = 0;
        for (const [, value] of this._cache) {
            fn(value);
            if (i % 100000 === 0) {
                await immediate();
            }
            i++;
        }
    }

    has(key: string) {
        return this._cache.has(key);
    }

    initialize() {}

    clear() {
        this.removeAllListeners();
        this._cache.clear();
    }
}
