export class BigMap<K, V> {
    _maps: Map<K, V>[] = [new Map()];
    readonly maxMapSize: number;

    constructor(maxMapSize = 2 ** 24) {
        this.maxMapSize = maxMapSize;
    }

    set(key: K, value: V): Map<K, V> {
        const map = this._maps[this._maps.length - 1];

        if (map.size === this.maxMapSize) {
            this._maps.push(new Map());
            return this.set(key, value);
        }

        return map.set(key, value);
    }

    has(key: K) {
        return _mapForKey(this._maps, key) !== undefined;
    }

    get(key: K) {
        return _valueForKey(this._maps, key);
    }

    delete(key: K) {
        const map = _mapForKey(this._maps, key);

        if (map !== undefined) {
            return map.delete(key);
        }

        return false;
    }

    clear() {
        for (const map of this._maps) {
            map.clear();
        }

        const first = this._maps[0];
        this._maps = [first];
    }

    get size() {
        let size = 0;

        for (const map of this._maps) {
            size += map.size;
        }

        return size;
    }

    forEach(callbackFn: (value: V, key: K, map: BigMap<K, V>) => void, thisArg?: any) {
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

    entries() {
        return _iterator<[K, V]>(this._maps, 'entries');
    }

    keys() {
        return _iterator<K>(this._maps, 'keys');
    }

    values() {
        return _iterator<V>(this._maps, 'values');
    }

    // tslint:disable-next-line: function-name
    [Symbol.iterator]() {
        return _iterator<[K, V]>(this._maps, Symbol.iterator);
    }
}

function _mapForKey<K, V, M extends Map<K, V>>(maps: M[], key: K): M | undefined {
    for (let index = maps.length - 1; index >= 0; index--) {
        const map = maps[index];

        if (map.has(key)) {
            return map;
        }
    }
    return undefined;
}

function _valueForKey<K, V, M extends Map<K, V>>(maps: M[], key: K): V | undefined {
    for (let index = maps.length - 1; index >= 0; index--) {
        const map = maps[index];
        const value = map.get(key);

        if (value !== undefined) {
            return value;
        }
    }
    return undefined;
}

function _iterator<R>(items: Map<any, any>[], name: any): IterableIterator<R> {
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
        // tslint:disable-next-line: function-name
        [Symbol.iterator]() {
            return this;
        },
    } as IterableIterator<R>;
}
