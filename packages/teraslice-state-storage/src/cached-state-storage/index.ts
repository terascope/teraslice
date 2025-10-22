import { EventEmitter } from 'node:events';
import { pImmediate, BigLRUMap } from '@terascope/core-utils';
import {
    CacheConfig, MGetCacheResponse, SetTuple,
    ValuesFn, EvictedEvent
} from '../interfaces.js';

export default class CachedStateStorage<T> extends EventEmitter {
    private _cache: BigLRUMap<T>;

    constructor(config: CacheConfig) {
        super();
        this._cache = new BigLRUMap(config.cache_size);
    }

    get(key: string | number): T | undefined {
        return this._cache.get(`${key}`);
    }

    mget(keyArray: (string | number)[]): MGetCacheResponse {
        return keyArray.reduce((cachedState: Record<string, any>, key) => {
            const state = this.get(key);
            if (state) cachedState[key] = state;
            return cachedState;
        }, {});
    }

    set(key: string | number, value: T): void {
        const results = this._cache.setpop(`${key}`, value);
        if (results && results.evicted) {
            this.emit('eviction', { key: results.key, data: results.value } as EvictedEvent<T>);
        }
    }

    mset(docArray: SetTuple<T>[]): void {
        for (const doc of docArray) {
            this.set(doc.key, doc.data);
        }
    }

    count(): number {
        return this._cache.size;
    }

    async values(fn: ValuesFn<T>): Promise<void> {
        let i = 0;
        for (const [, value] of this._cache) {
            fn(value);
            if (i % 10000 === 0) {
                await pImmediate();
            }
            i++;
        }
    }

    has(key: string | number): boolean {
        return this._cache.has(`${key}`);
    }

    clear(): void {
        this.removeAllListeners();
        this._cache.clear();
    }
}
