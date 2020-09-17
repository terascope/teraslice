import { LATEST_VERSION } from '@terascope/data-types';
import { DataTypeFieldConfig, Maybe, DataTypeVersion } from '@terascope/types';
import { Builder } from '../builder';
import {
    JSONValue, runValueAggregation, ValueAggregation, Vector
} from '../vector';
import { getVectorId } from './utils';

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
 *
 * @todo add cast function
*/
export class Column<T = unknown> {
    name: string;
    readonly version: DataTypeVersion;
    readonly config: DataTypeFieldConfig;
    protected readonly _vector: Vector<T>;

    static fromJSON<R>(
        options: Omit<ColumnOptions<R>, 'vector'>,
        values: Maybe<R>[]|readonly Maybe<R>[] = []
    ): Column<R extends (infer U)[] ? Vector<U> : R> {
        const builder = Builder.make<R>(options.config, values.length);
        values.forEach((val) => builder.append(val));
        return new Column({
            ...options,
            vector: builder.toVector()
        }) as any;
    }

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
     * A Unique ID for the Column (excludes metadata)
    */
    get id(): string {
        return getVectorId(this._vector);
    }

    /**
     * Get the underling Vector.
     * Use with caution since it can cause this Column/DataFrame to be out-of-sync
    */
    get vector(): Vector<T> {
        return this._vector;
    }

    /**
     * Create a fork of the Column
    */
    fork(vector?: Vector<T>): Column<T> {
        return new Column<T>({
            name: this.name,
            version: this.version,
            config: this.config,
            vector: vector ?? this.vector,
        });
    }

    /**
     * Map over the values and mutate them (must keep the same data type)
     *
     * @returns the new column
    */
    map(fn: (value: Maybe<T>, index: number) => Maybe<T>): Column<T> {
        const len = this._vector.size;
        const builder = Builder.make<T>(this.config, len, this._vector.childConfig);
        for (let i = 0; i < this._vector.size; i++) {
            const value = this.vector.get(i) as Maybe<T>;
            builder.append(fn(value, i));
        }
        return new Column<T>({
            name: this.name,
            version: this.version,
            config: this.config,
            vector: builder.toVector()
        });
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
        columnOptions: Omit<ColumnOptions<R>, 'vector'>,
        fn?: (value: Maybe<T>, index: number) => Maybe<R>
    ): Column<R> {
        const config = columnOptions?.config ?? this.config;
        const name = columnOptions?.name ?? this.name;
        if (fn) {
            const builder = Builder.make<R>(config);
            for (let i = 0; i < this._vector.size; i++) {
                const value = this.vector.get(i) as Maybe<T>;
                builder.append(fn(value, i));
            }
            return new Column<R>({
                name,
                config,
                vector: builder.toVector()
            });
        }
        return new Column<R>({
            name: this.name,
            version: this.version,
            config: this.config,
            vector: this.vector.fork() as Vector<any>
        });
    }

    /**
     * Creates a new column, you can optionally transform the values
     * but shouldn't change the length.
     *
     * @returns the new column so it works like fluent API
    */
    filter(fn: (value: Maybe<T>, index: number) => boolean): Column<T> {
        const builder = Builder.make<T>(this.config);
        for (let i = 0; i < this._vector.size; i++) {
            const value = this.vector.get(i) as Maybe<T>;
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

    avg(): number|bigint {
        return runValueAggregation(this._vector, ValueAggregation.avg);
    }

    sum(): number|bigint {
        return runValueAggregation(this._vector, ValueAggregation.sum);
    }

    min(): number|bigint {
        return runValueAggregation(this._vector, ValueAggregation.min);
    }

    max(): number|bigint {
        return runValueAggregation(this._vector, ValueAggregation.max);
    }

    count(): number {
        return runValueAggregation(this._vector, ValueAggregation.count);
    }

    /**
     * Convert the Column an array of values (the output is JSON compatible)
     *
     * @note probably only useful for debugging
    */
    toJSON(): Maybe<JSONValue<T>>[] {
        return this._vector.toJSON();
    }
}
