const defaultMaxSize = 2 ** 24;

/**
 * Avoid v8 maximum size for Set by spreading the cache across multiple Sets.
 * This class has the same API as Set but minus more differences in ->add and ->forEach
 */
export class BigSet<V> {
    readonly maxMapSize: number;
    private _sets: Set<V>[];
    private _current: Set<V>;
    private _simpleMode: boolean;

    constructor(maxMapSize = defaultMaxSize) {
        this.maxMapSize = maxMapSize;
        this._current = new Set();
        this._simpleMode = true;
        this._sets = [this._current];
    }

    add(value: V): Set<V> {
        if (this._current.size >= this.maxMapSize) {
            this._current = new Set();
            this._sets.push(this._current);
            this._simpleMode = false;
        }

        return this._current.add(value);
    }

    has(value: V): boolean {
        if (this._simpleMode) {
            return this._current.has(value);
        }
        return _getSetWithValue(this._sets, value) !== undefined;
    }

    delete(value: V): boolean {
        if (this._simpleMode) {
            return this._current.delete(value);
        }

        const set = _getSetWithValue(this._sets, value);

        if (set !== undefined) {
            return set.delete(value);
        }

        return false;
    }

    clear(): void {
        if (this._simpleMode) {
            return this._current.clear();
        }

        for (const set of this._sets) {
            set.clear();
        }

        this._sets = [this._current];
        this._simpleMode = true;
    }

    get size(): number {
        if (this._simpleMode) {
            return this._current.size;
        }

        let size = 0;

        for (const map of this._sets) {
            size += map.size;
        }

        return size;
    }

    forEach(callbackFn: (value: V, value2: V, map: BigSet<V>) => void, thisArg?: unknown): void {
        if (thisArg) {
            for (const value of this) {
                callbackFn.call(thisArg, value, value, this);
            }
        } else {
            for (const value of this) {
                callbackFn(value, value, this);
            }
        }
    }

    [Symbol.iterator](): IterableIterator<V> {
        if (this._simpleMode) {
            return this._current[Symbol.iterator]();
        }
        return _iterator<V>(this._sets, Symbol.iterator);
    }
}

function _getSetWithValue<V, M extends Set<V>>(sets: M[], value: V): M | undefined {
    const start = sets.length - 1;
    for (let index = start; index >= 0; index--) {
        const set = sets[index];

        if (set.has(value)) {
            return set;
        }
    }
    return undefined;
}

function _iterator<R>(items: Set<any>[], name: any): IterableIterator<R> {
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
