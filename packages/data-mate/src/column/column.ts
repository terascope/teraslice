import { LATEST_VERSION } from '@terascope/data-types';
import { toString } from '@terascope/utils';
import {
    DataTypeFieldConfig, Maybe, DataTypeVersion, SortOrder
} from '@terascope/types';
import { Builder } from '../builder';
import {
    isVector,
    JSONValue, runVectorAggregation, ValueAggregation, Vector
} from '../vector';
import { ColumnFnMode, ColumnOptions, ColumnTransformConfig } from './interfaces';
import { getVectorId } from './utils';

/**
 * A single column of values with the same data type.
 *
 * Changing the values is safe as long the length doesn't change.
 * When adding or removing values it is better to create a new Column.
*/
export class Column<T = unknown> {
    name: string;
    readonly version: DataTypeVersion;
    readonly config: DataTypeFieldConfig;
    protected readonly _vector: Vector<T>;

    static fromJSON<R>(
        options: ColumnOptions,
        values: Maybe<R>[]|readonly Maybe<R>[] = []
    ): Column<R extends (infer U)[] ? Vector<U> : R> {
        const builder = Builder.make<R>(options.config, values.length);
        values.forEach((val) => builder.append(val));
        return new Column<any>(builder.toVector(), options);
    }

    constructor(vector: Vector<T>, options: ColumnOptions|Readonly<ColumnOptions>) {
        this.name = options.name;
        this.version = options.version ?? LATEST_VERSION;
        this.config = { ...options.config };
        this._vector = vector;

        const vType = vector.fieldType;
        const cType = this.config.type;
        if (vType !== cType) {
            throw new Error(
                `Invalid Vector type ${vType} given to column of type "${cType}"`
            );
        }
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
        return new Column<T>(vector ?? this.vector, {
            name: this.name,
            version: this.version,
            config: this.config,
        });
    }

    /**
     * Transform the values with in a column
     *
     * @returns the new column
    */
    transform<R = T, A extends Record<string, unknown> = Record<string, unknown>>(
        transformConfig: ColumnTransformConfig<T, A, R>,
        args?: A
    ): Column<R> {
        const options: ColumnOptions = {
            config: transformConfig.output ?? this.config,
            name: this.name,
            version: this.version,
        };
        const transform = transformConfig.fn(args ?? ({} as any));

        if (transform.mode === ColumnFnMode.EACH) {
            const builder = Builder.make<R>(options.config);
            for (let i = 0; i < this._vector.size; i++) {
                const value = this.vector.get(i) as Maybe<T|Vector<T>>;
                builder.append(transform.fn(value));
            }
            return new Column<R>(builder.toVector(), options);
        }

        // FIXME refactor this
        if (transform.mode === ColumnFnMode.EACH_VALUE) {
            const builder = Builder.make<R>(options.config);
            for (let i = 0; i < this._vector.size; i++) {
                const value = this.vector.get(i) as Maybe<T|Vector<T>>;
                if (value == null) {
                    builder.append(null);
                } else if (isVector<T>(value)) {
                    const values: Maybe<R>[] = [];
                    for (const val of value) {
                        values.push(
                            val != null
                                ? transform.fn(val)
                                : null
                        );
                    }
                    builder.append(values);
                } else {
                    builder.append(transform.fn(value));
                }
            }
            return new Column<R>(builder.toVector(), options);
        }

        if (transform.mode === ColumnFnMode.ALL) {
            return new Column<R>(transform.fn(this.vector), options);
        }

        throw new Error(`Invalid transformation given ${toString(transform)}`);
    }

    /**
     * Creates a new column, if the function returns false
     * then the value is set to null
     *
     * @returns the new column so it works like fluent API
    */
    validate(fn: (value: Maybe<T>, index: number) => boolean): Column<T> {
        const builder = Builder.make<T>(this.config);
        for (let i = 0; i < this._vector.size; i++) {
            const value = this.vector.get(i) as Maybe<T>;
            builder.append(fn(value, i) ? value : null);
        }

        return new Column<T>(builder.toVector(), {
            name: this.name,
            config: this.config,
            version: this.version,
        });
    }

    /**
     * Sort the column
    */
    sort(direction?: SortOrder): Column<T> {
        const sortedIndices = this._vector.getSortedIndices(direction);
        const len = sortedIndices.length;
        const builder = Builder.make<T>(this.config, len, this.vector.childConfig);

        for (let i = 0; i < len; i++) {
            const moveTo = sortedIndices[i];
            const val = this._vector.get(i);
            builder.set(moveTo, val);
        }

        return this.fork(builder.toVector());
    }

    avg(): number|bigint {
        return runVectorAggregation(this._vector, ValueAggregation.avg);
    }

    sum(): number|bigint {
        return runVectorAggregation(this._vector, ValueAggregation.sum);
    }

    min(): number|bigint {
        return runVectorAggregation(this._vector, ValueAggregation.min);
    }

    max(): number|bigint {
        return runVectorAggregation(this._vector, ValueAggregation.max);
    }

    count(): number {
        return runVectorAggregation(this._vector, ValueAggregation.count);
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
