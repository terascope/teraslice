
import LRU from 'mnemonist/lru-cache';
import { promisify } from 'util';
import { CacheConfig, MGetCacheResponse, SetTuple, ValuesFn } from '../interfaces';

const immediate = promisify(setImmediate);

export default class CachedStateStorage<T> {
    protected IDField: string;
    private cache: LRU<string, T>;

    constructor(config: CacheConfig) {
        this.IDField = '_key';
        this.cache = new LRU(config.cache_size);
    }

    get(key: string): T | undefined {
        return this.cache.get(key);
    }

    mget(keyArray: string[]): MGetCacheResponse {
        return keyArray.reduce((cachedState, key) => {
            const state = this.cache.get(key);
            if (state) cachedState[key] = state;
            return cachedState;
        }, {});
    }

    set(key: string, value: T) {
        const results = this.cache.setpop(key, value);
        if (results && results.evicted) return results;
        return undefined;
    }

    mset(docArray: SetTuple<T>[]) {
        return docArray.map(doc => this.set(doc.key, doc.data)).filter(Boolean);
    }

    count() {
        return this.cache.size;
    }

    async values(fn: ValuesFn<T>) {
        const iterator = this.cache.values();
        // @ts-ignore
        while (!iterator.done) {
            const next = iterator.next();
            const { done, value } = next;
            if (!done) fn(value);
            await immediate();
        }
    }

    has(key: string) {
        return this.cache.has(key);
    }

    initialize() {}

    clear() {
        this.cache.clear();
    }
}
