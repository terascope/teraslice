const defaultMaxSize = 2 ** 24;

/**
 * Avoid v8 maximum size for Map by spreading the cache across multiple Maps.
 * This class has the same API as Map but minus more differences in ->set and ->forEach
 */
export class BigMap<K, V> {
    /**
     * In some cache settings key evictions may not be able to keep up with the addition
     * of new keys, setting the max size at 8.7M keys solves this issue
     */
    static DEFAULT_MAX_SIZE = Math.floor(defaultMaxSize / 2);

    readonly maxMapSize: number;
    private _maps: Map<K, V>[];
    private _current: Map<K, V>;
    private _simpleMode: boolean;

    constructor(entries?: readonly (readonly [K, V])[] | null) {
        this.maxMapSize = BigMap.DEFAULT_MAX_SIZE;
        this._current = new Map(entries);
        this._simpleMode = true;
        this._maps = [this._current];
    }

    set(key: K, value: V): Map<K, V> {
        if (this._current.size >= this.maxMapSize) {
            this._current = new Map();
            this._maps.push(this._current);
            this._simpleMode = false;
        }

        return this._current.set(key, value);
    }

    has(key: K): boolean {
        if (this._simpleMode) {
            return this._current.has(key);
        }
        return _mapForKey(this._maps, key) !== undefined;
    }

    get(key: K): V | undefined {
        if (this._simpleMode) {
            return this._current.get(key);
        }
        return _valueForKey(this._maps, key);
    }

    delete(key: K): boolean {
        if (this._simpleMode) {
            return this._current.delete(key);
        }
        const map = _mapForKey(this._maps, key);

        if (map !== undefined) {
            return map.delete(key);
        }

        return false;
    }

    clear(): void {
        if (this._simpleMode) {
            return this._current.clear();
        }

        for (const map of this._maps) {
            map.clear();
        }

        this._maps = [this._current];
        this._simpleMode = true;
    }

    get size(): number {
        if (this._simpleMode) {
            return this._current.size;
        }

        let size = 0;

        for (const map of this._maps) {
            size += map.size;
        }

        return size;
    }

    forEach(callbackFn: (value: V, key: K, map: BigMap<K, V>) => void, thisArg?: unknown): void {
        if (thisArg) {
            for (const [key, value] of this.entries()) {
                callbackFn.call(thisArg, value, key, this);
            }
        } else {
            for (const [key, value] of this.entries()) {
                callbackFn(value, key, this);
            }
        }
    }

    entries(): IterableIterator<[K, V]> {
        if (this._simpleMode) {
            return this._current.entries();
        }
        return _iterator<[K, V]>(this._maps, 'entries');
    }

    keys(): IterableIterator<K> {
        if (this._simpleMode) {
            return this._current.keys();
        }
        return _iterator<K>(this._maps, 'keys');
    }

    values(): IterableIterator<V> {
        if (this._simpleMode) {
            return this._current.values();
        }
        return _iterator<V>(this._maps, 'values');
    }

    [Symbol.iterator](): IterableIterator<[K, V]> {
        if (this._simpleMode) {
            return this._current[Symbol.iterator]();
        }
        return _iterator<[K, V]>(this._maps, Symbol.iterator);
    }
}

function _mapForKey<K, V, M extends Map<K, V>>(maps: M[], key: K): M | undefined {
    const start = maps.length - 1;
    for (let index = start; index >= 0; index--) {
        const map = maps[index];

        if (map.has(key)) {
            return map;
        }
    }
    return undefined;
}

function _valueForKey<K, V, M extends Map<K, V>>(maps: M[], key: K): V | undefined {
    const start = maps.length - 1;
    for (let index = start; index >= 0; index--) {
        const map = maps[index];
        const value = map.get(key);

        if (value !== undefined) {
            return value;
        }
    }
    return undefined;
}

function _iterator<R>(
    items: Map<any, any>[],
    name: 'keys' | 'values' | 'entries' | typeof Symbol.iterator
): IterableIterator<R> {
    let index = 0;

    let iterator = items[index][name]();

    return {
        next: () => {
            let result = iterator.next();

            if (result.done && index < items.length - 1) {
                index++;
                iterator = items[index][name]();
                result = iterator.next();
            }

            return result;
        },
        [Symbol.iterator]() {
            return this;
        },
    } as IterableIterator<R>;
}
