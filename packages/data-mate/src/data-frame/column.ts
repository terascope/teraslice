import { LATEST_VERSION } from '@terascope/data-types';
import { DataTypeFieldConfig, Maybe, DataTypeVersion } from '@terascope/types';
import { newBuilder } from '../builder';
import { Vector } from '../vector';

/**
 * Column options
 */
export interface ColumnOptions<T> {
    name: string;
    version?: DataTypeVersion;
    config: DataTypeFieldConfig;
    vector: Vector<T>;
}

/**
 * A single column of values with the same data type.
 *
 * Changing the values is safe as long the length doesn't change.
 * When adding or removing values it is better to create a new Column.
*/
export class Column<T = unknown> {
    protected readonly _vector: Vector<T>;
    readonly version: DataTypeVersion;
    readonly name: string;
    readonly config: DataTypeFieldConfig;

    constructor(options: ColumnOptions<T>) {
        this.name = options.name;
        this.version = options.version ?? LATEST_VERSION;
        this.config = { ...options.config };
        const vType = options.vector.fieldType;
        const cType = this.config.type;
        if (vType !== cType) {
            throw new Error(
                `Invalid Vector type ${vType} given to column of type "${cType}"`
            );
        }
        this._vector = options.vector;
    }

    * [Symbol.iterator](): IterableIterator<Maybe<T>> {
        yield* this._vector;
    }

    /**
     * Get the size of the values in the Vector
    */
    get size(): number {
        return this._vector.size;
    }

    /**
     * Get the underling Vector.
     * Use with caution since it can cause this Column/DataFrame to be out-of-sync
    */
    get vector(): Vector<T> {
        return this._vector;
    }

    clone(): Column<T> {
        return new Column<T>({
            name: this.name,
            version: this.version,
            config: this.config,
            vector: this.vector.clone(),
        });
    }

    /**
     * Get value by index
    */
    get(index: number): Maybe<T> {
        return this._vector.get(index);
    }

    /**
     * Get the distinct values in column
    */
    distinct(): number {
        return this._vector.distinct();
    }

    /**
     * Map over the values and mutate them (must keep the same data type)
     *
     * @returns the new column
    */
    map(fn: (value: Maybe<T>, index: number) => Maybe<T>): Column<T> {
        return new Column<T>({
            name: this.name,
            version: this.version,
            config: this.config,
            vector: this._vector.map(fn),
        });
    }

    /**
     * Reduce the column to particular value.
     *
     * In the future we will have optimized reducers
     * depending on the data type reducer.
     *
     * @returns the accumulated values
    */
    reduce<R>(fn: (acc: R, value: Maybe<T>, index: number) => R, initial: R): R {
        const len = this.size;
        let acc = initial;
        for (let i = 0; i < len; i++) {
            acc = fn(acc, this.get(i), i);
        }
        return acc;
    }

    /**
     * Creates a new column, you can optionally transform the values
     * but shouldn't change the length.
     *
     * This can be used to change the name, type of column.
     * Useful for replacing a column in a DataFrame.
     *
     * @returns the new column
    */
    transform<R = T>(
        columnOptions: ColumnOptions<R>,
        fn?: (value: Maybe<T>, index: number) => Maybe<R>
    ): Column<R> {
        const config = columnOptions?.config ?? this.config;
        const name = columnOptions?.name ?? this.name;
        const builder = newBuilder<R>(config);
        for (let i = 0; i < this.size; i++) {
            const value = this.get(i);
            builder.append(
                fn ? fn(value, i) : value as Maybe<R>
            );
        }
        return new Column<R>({
            name,
            config,
            vector: builder.toVector()
        });
    }

    /**
     * Creates a new column, you can optionally transform the values
     * but shouldn't change the length.
     *
     * @returns the new column so it works like fluent API
    */
    filter(fn: (value: Maybe<T>, index: number) => boolean): Column<T> {
        const builder = newBuilder<T>(this.config);
        for (let i = 0; i < this.size; i++) {
            const value = this.get(i);
            if (fn(value, i)) {
                builder.append(value);
            }
        }
        return new Column<T>({
            name: this.name,
            config: this.config,
            vector: builder.toVector()
        });
    }

    /**
     * Convert the Column an array of values (the output is JSON compatible)
     *
     * @note probably only useful for debugging
    */
    toJSON<V>(): Maybe<V>[] {
        return this._vector.toJSON<V>();
    }
}
