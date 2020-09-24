import {
    DataTypeFieldConfig, DataTypeFields,
    Maybe, Nil, SortOrder,
    ReadonlyDataTypeFields
} from '@terascope/types';
import { Data, VectorType } from './interfaces';

/**
 * An immutable typed Array class with a constrained API.
 *
 * @note null/undefined values are treated the same
*/
export abstract class Vector<T = unknown> {
    /**
     * Make an instance of a Vector from a config
    */
    static make<R>(
        config: Readonly<DataTypeFieldConfig>,
        data: Data<R>,
        childConfig?: DataTypeFields
    ): Vector<R> {
        throw new Error(`This is overridden in the index file, ${config} ${data} ${childConfig}`);
    }

    readonly type: VectorType;
    readonly config: Readonly<DataTypeFieldConfig>;
    readonly valueToJSON?: ValueToJSONFn<T>;
    readonly childConfig?: ReadonlyDataTypeFields;
    /**
     * Do not modify this
    */
    readonly data: Data<T>;

    protected readonly _size: number;

    constructor(
        /**
         * This will be set automatically by specific Vector classes
         */
        type: VectorType,
        {
            data, config, childConfig, valueToJSON,
        }: VectorOptions<T>
    ) {
        this.type = type;
        this.config = config;
        this.valueToJSON = valueToJSON;

        this.data = data;
        this.childConfig = childConfig;
        this._size = this.data.values.length;
    }

    * [Symbol.iterator](): IterableIterator<Maybe<T>> {
        yield* this.data.values;
    }

    /**
     * Returns the number items in the Vector
    */
    get size(): number {
        return this._size;
    }

    /**
     * Gets the number distinct values in the Vector
    */
    distinct(): number {
        return new Set(this).size;
    }

    /**
     * Get value by index
    */
    get(index: number, json?: boolean): Maybe<T>|Maybe<JSONValue<T>> {
        const val = this.data.values[index];
        if (val == null) return val as Nil;
        if (!json || !this.valueToJSON) return val;
        return this.valueToJSON(val);
    }

    /**
     * Create a fork of the Vector
    */
    abstract fork(data?: Data<T>): Vector<T>;

    /**
     * Filter the values in the Vector, returns new Vector
    */
    filter(
        fn: (value: MaybeJSONValue<T>, index: number) => boolean,
        json?: boolean
    ): Vector<T> {
        const values: Maybe<any>[] = [];
        for (let i = 0; i < this.size; i++) {
            const val = this.get(i, json as any);
            if (fn(val, i)) {
                values.push(val);
            }
        }

        // FIXME this doesn't handle coercion
        return this.fork(Object.freeze({
            values: Object.freeze(values)
        }));
    }

    /**
     * Reduce the values in the Vector, returns the result
    */
    reduce<R>(
        fn: (acc: R, value: MaybeJSONValue<T>, index: number) => R,
        initial: R,
        json?: boolean
    ): R {
        let acc = initial;
        for (let i = 0; i < this.size; i++) {
            acc = fn(acc, this.get(i, json), i);
        }
        return acc;
    }

    /**
     * Create a new Vector with the range of values
    */
    slice(start?: number, end?: number): Vector<T> {
        return this.fork(Object.freeze({
            values: Object.freeze(
                this.data.values.slice(start, end)
            )
        }));
    }

    /**
     * Sort the values in a Vector and return
     * an array with the updated indices.
    */
    getSortedIndices(direction?: SortOrder): number[] {
        const indices: number[] = Array(this._size);
        const original: [number, Maybe<T>][] = Array(this._size);

        for (let i = 0; i < this._size; i++) {
            original[i] = [i, this.get(i) as Maybe<T>];
        }

        original
            .sort(([, a], [, b]) => this.compare(a, b))
            .forEach(([i], newPosition) => {
                if (direction === 'desc') {
                    indices[i] = Math.abs(newPosition - (this._size - 1));
                } else {
                    indices[i] = newPosition;
                }
            });

        return indices;
    }

    compare(a: Maybe<T>, b: Maybe<T>): -1|0|1 {
        const aVal = a as any;
        const bVal = b as any;
        if (aVal < bVal) return -1;
        if (aVal > bVal) return 1;
        return 0;
    }

    /**
     * Convert the Vector an array of values (the output is JSON compatible)
    */
    toJSON(): Maybe<JSONValue<T>>[] {
        const res: Maybe<JSONValue<T>>[] = Array(this.size);
        for (let i = 0; i < this.size; i++) {
            res[i] = this.get(i, true) as JSONValue<T>;
        }
        return res;
    }
}

/**
 * Returns true if the input is a Vector
 */
export function isVector<T>(input: unknown): input is Vector<T> {
    return input instanceof Vector;
}

/**
 * Serialize a value to a JSON compatible format (so it can be JSON stringified)
*/
export type ValueToJSONFn<T> = (value: T, thisArg?: Vector<T>) => any;

/**
 * A list of Vector Options
 */
export interface VectorOptions<T> {
    data: Data<T>;
    config: Readonly<DataTypeFieldConfig>;
    valueToJSON?: ValueToJSONFn<T>;
    childConfig?: ReadonlyDataTypeFields;
}

export type JSONValue<T> = T extends Vector<infer U> ? U[] : T;
export type MaybeJSONValue<T> = Maybe<T>|Maybe<JSONValue<T>>;
