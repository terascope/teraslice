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
import {
    ColumnFnMode, ColumnOptions, ColumnTransformConfig, ColumnValidateConfig
} from './interfaces';
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
     * Transform the values with in a column.
     *
     * @note this will keep the same length
     *
     * @todo validate args and accept vector types
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
        const transform = transformConfig.create(args ?? ({} as any));

        if (transform.mode === ColumnFnMode.EACH) {
            const builder = Builder.make<R>(options.config, this._vector.size);
            for (let i = 0; i < this._vector.size; i++) {
                const value = this.vector.get(i) as Maybe<T|Vector<T>>;
                builder.append(transform.fn(value));
            }
            return new Column<R>(builder.toVector(), options);
        }

        // FIXME refactor this
        if (transform.mode === ColumnFnMode.EACH_VALUE) {
            const builder = Builder.make<R>(options.config, this._vector.size);
            for (let i = 0; i < this._vector.size; i++) {
                const value = this.vector.get(i) as Maybe<T|Vector<T>>;
                if (transform.skipNulls && value == null) {
                    builder.append(null);
                } else if (isVector<T>(value)) {
                    const values: Maybe<R>[] = [];
                    for (const val of value) {
                        if (transform.skipNulls && val == null) {
                            values.push(null);
                        } else {
                            values.push(
                                transform.fn(val as any)
                            );
                        }
                    }
                    builder.append(values);
                } else {
                    builder.append(
                        transform.fn(value as any)
                    );
                }
            }
            return new Column<R>(builder.toVector(), options);
        }

        if (transform.mode === ColumnFnMode.ALL) {
            // FIXME validate that it doesn't change the length
            return new Column<R>(transform.fn(this.vector), options);
        }

        throw new Error(`Invalid transformation given ${toString(transform)}`);
    }

    /**
     * Creates a new column, if the function returns false
     * then the value is set to null.
     *
     * @note this will keep the same length
     *
     * @todo validate args and accept vector types
     *
     * @returns the new column so it works like fluent API
    */
    validate<A extends Record<string, unknown> = Record<string, unknown>>(
        validateConfig: ColumnValidateConfig<T, A>,
        args?: A
    ): Column<T> {
        const options: ColumnOptions = {
            config: this.config,
            name: this.name,
            version: this.version,
        };
        const validator = validateConfig.create(args ?? ({} as any));

        if (validator.mode === ColumnFnMode.EACH) {
            const builder = Builder.make<T>(options.config, this._vector.size);
            for (let i = 0; i < this._vector.size; i++) {
                const value = this.vector.get(i) as Maybe<T|Vector<T>>;
                if (validator.fn(value)) {
                    builder.append(value);
                } else {
                    builder.append(null);
                }
            }
            return new Column<T>(builder.toVector(), options);
        }

        // FIXME refactor this
        if (validator.mode === ColumnFnMode.EACH_VALUE) {
            const builder = Builder.make<T>(options.config, this._vector.size);
            for (let i = 0; i < this._vector.size; i++) {
                const value = this.vector.get(i) as Maybe<T|Vector<T>>;
                if (validator.skipNulls && value == null) {
                    builder.append(null);
                } else if (isVector<T>(value)) {
                    const values: Maybe<T>[] = [];
                    for (const val of value) {
                        if (validator.skipNulls && val == null) {
                            values.push(null);
                        } else if (validator.fn(val as any)) {
                            values.push(val);
                        } else {
                            values.push(null);
                        }
                    }
                    builder.append(values);
                } else if (validator.fn(value as any)) {
                    builder.append(value);
                } else {
                    builder.append(null);
                }
            }
            return new Column<T>(builder.toVector(), options);
        }

        if (validator.mode === ColumnFnMode.ALL) {
            // FIXME validate that it doesn't change the length
            return new Column<T>(validator.fn(this.vector), options);
        }

        throw new Error(`Invalid validator given ${toString(validator)}`);
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
