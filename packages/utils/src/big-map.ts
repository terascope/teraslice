const maxMapSize = Math.pow(2, 24);

export class BigMap<K, V> {
    maps: Map<K, V>[] = [];

    constructor() {
        this.maps.push(new Map());
    }

    set(key: K, value: V): Map<K, V> {
        const map = this.maps[this.maps.length - 1];

        if (map.size === maxMapSize) {
            this.maps.push(new Map());
            return this.set(key, value);
        }

        return map.set(key, value);
    }

    has(key: K) {
        return _mapForKey(this.maps, key) !== undefined;
    }

    get(key: K) {
        return _valueForKey(this.maps, key);
    }

    delete(key: K) {
        const map = _mapForKey(this.maps, key);

        if (map !== undefined) {
            return map.delete(key);
        }

        return false;
    }

    clear() {
        for (const map of this.maps) {
            map.clear();
        }
    }

    get size() {
        let size = 0;

        for (const map of this.maps) {
            size += map.size;
        }

        return size;
    }

    forEach(callbackFn: (value: V, key: K) => void, thisArg?: any) {
        if (thisArg) {
            for (const [key, value] of this.entries()) {
                callbackFn.call(thisArg, value, key);
            }
        } else {
            for (const [key, value] of this.entries()) {
                callbackFn(value, key);
            }
        }
    }

    entries() {
        return _iterator<[K, V]>(this.maps, 'entries');
    }

    keys() {
        return _iterator<K>(this.maps, 'keys');
    }

    values() {
        return _iterator<V>(this.maps, 'values');
    }

    // tslint:disable-next-line: function-name
    [Symbol.iterator]() {
        return _iterator<[K, V]>(this.maps, Symbol.iterator);
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
