import { LATEST_VERSION } from '@terascope/data-types';
import {
    DataTypeFieldConfig, Maybe, DataTypeVersion, SortOrder
} from '@terascope/types';
import { Builder } from '../builder';
import {
    JSONValue, runVectorAggregation, ValueAggregation, Vector
} from '../vector';
import {
    ColumnOptions, ColumnTransformConfig, ColumnValidateConfig, TransformMode
} from './interfaces';
import { getVectorId, mapVector } from './utils';

/**
 * A single column of values with the same data type.
 *
 * Changing the values is safe as long the length doesn't change.
 * When adding or removing values it is better to create a new Column.
 *
 * @todo add pipeline that will do a chain of validators/transformations
*/
export class Column<T = unknown> {
    name: string;
    readonly version: DataTypeVersion;
    protected readonly _vector: Vector<T>;

    static fromJSON<R>(
        options: ColumnOptions & { config: Readonly<DataTypeFieldConfig> },
        values: Maybe<R>[]|readonly Maybe<R>[] = []
    ): Column<R extends (infer U)[] ? Vector<U> : R> {
        const builder = Builder.make<R>(options.config, values.length);
        values.forEach((val) => builder.append(val));
        return new Column<any>(builder.toVector(), options);
    }

    constructor(vector: Vector<T>, options: ColumnOptions|Readonly<ColumnOptions>) {
        this.name = options.name;
        this.version = options.version ?? LATEST_VERSION;
        this._vector = vector;
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
     * Get the underling Vector.
     * Use with caution since it can cause this Column/DataFrame to be out-of-sync
    */
    get config(): Readonly<DataTypeFieldConfig> {
        return this._vector.config;
    }

    /**
     * Create a fork of the Column
    */
    fork(vector?: Vector<T>): Column<T> {
        return new Column<T>(vector ?? this.vector, {
            name: this.name,
            version: this.version,
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
    transform<R, A extends Record<string, any>>(
        transformConfig: ColumnTransformConfig<T, R, A>,
        args?: A
    ): Column<R> {
        const options: ColumnOptions = {
            name: this.name,
            version: this.version,
        };

        const transform = transformConfig.create(
            this.vector, { ...args } as A
        );

        return new Column<R>(
            mapVector<T, R>(
                this.vector,
                transform,
                transformConfig.output,
            ),
            options
        );
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
    validate<A extends Record<string, any>>(
        validateConfig: ColumnValidateConfig<T, A>,
        args?: A
    ): Column<T> {
        const options: ColumnOptions = {
            name: this.name,
            version: this.version,
        };

        const validator = validateConfig.create(
            this.vector, { ...args } as A
        );
        const transform = validator.mode !== TransformMode.NONE ? ({
            ...validator,
            fn(value: any): any {
                if (validator.fn(value)) {
                    return value;
                }
                return null;
            }
        }) : validator;

        return new Column<T>(
            mapVector<T, T>(this.vector, transform),
            options
        );
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
