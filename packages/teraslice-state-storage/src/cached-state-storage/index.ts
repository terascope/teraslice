import { EventEmitter } from 'events';
import LRUMap from 'mnemonist/lru-map';
import { pImmediate, BigMap } from '@terascope/utils';

import { CacheConfig, MGetCacheResponse, SetTuple, ValuesFn, EvictedEvent } from '../interfaces';

export default class CachedStateStorage<T> extends EventEmitter {
    protected IDField: string;
    private _cache: LRUMap<string, T>;

    constructor(config: CacheConfig) {
        super();
        this.IDField = '_key';
        this._cache = new LRUMap(config.cache_size);
        // @ts-ignore
        this._cache.items = new BigMap();
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
        docArray.forEach((doc) => this.set(doc.key, doc.data));
    }

    count() {
        return this._cache.size;
    }

    async values(fn: ValuesFn<T>) {
        let i = 0;
        for (const [, value] of this._cache) {
            fn(value);
            if (i % 100000 === 0) {
                await pImmediate();
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
