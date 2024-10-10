const defaultMaxSize = 2 ** 24;

/**
 * Avoid v8 maximum size for Set by spreading the cache across multiple Sets.
 * This class has the same API as Set but minus more differences in ->add and ->forEach
 */
export class BigSet<T> {
    static DEFAULT_MAX_SIZE = defaultMaxSize;

    readonly maxMapSize: number;
    private _sets: Set<T>[];
    private _current: Set<T>;
    private _simpleMode: boolean;

    constructor(values?: readonly T[] | null) {
        this.maxMapSize = BigSet.DEFAULT_MAX_SIZE;
        this._current = new Set(values);
        this._simpleMode = true;
        this._sets = [this._current];
    }

    add(value: T): Set<T> {
        if (this._current.size >= this.maxMapSize) {
            this._current = new Set();
            this._sets.push(this._current);
            this._simpleMode = false;
        }

        return this._current.add(value);
    }

    has(value: T): boolean {
        if (this._simpleMode) {
            return this._current.has(value);
        }
        return _getSetWithValue(this._sets, value) !== undefined;
    }

    delete(value: T): boolean {
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

    forEach(callbackFn: (value: T, value2: T, map: BigSet<T>) => void, thisArg?: unknown): void {
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

    [Symbol.iterator](): IterableIterator<T> {
        if (this._simpleMode) {
            return this._current[Symbol.iterator]();
        }
        return _iterator<T>(this._sets, Symbol.iterator);
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

function _iterator<R>(items: Set<any>[], name: typeof Symbol.iterator): IterableIterator<R> {
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
