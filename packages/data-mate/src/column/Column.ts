import { LATEST_VERSION } from '@terascope/data-types';
import {
    DataTypeFieldConfig, Maybe, DataTypeVersion, SortOrder
} from '@terascope/types';
import { Builder } from '../builder';
import {
    JSONValue, Vector
} from '../vector';
import {
    ColumnOptions, ColumnTransformConfig, ColumnValidateConfig, TransformMode
} from './interfaces';
import { runVectorAggregation, ValueAggregation } from './aggregations';
import {
    getVectorId, mapVector, validateFieldTransformArgs, validateFieldTransformType
} from './utils';
import { WritableData } from '../core';

type NameType = (number|string|symbol);
/**
 * A single column of values with the same data type.
 *
 * Changing the values is safe as long the length doesn't change.
 * When adding or removing values it is better to create a new Column.
 *
 * @todo add pipeline that will do a chain of validators/transformations
*/
export class Column<T = unknown, N extends NameType = string> {
    /**
     * Create a Column from an array of values
    */
    static fromJSON<R, F extends NameType = string>(
        name: F,
        config: Readonly<DataTypeFieldConfig>,
        values: Maybe<R>[]|readonly Maybe<R>[] = [],
        version?: DataTypeVersion
    ): Column<R extends (infer U)[] ? Vector<U> : R, F> {
        const builder = Builder.make<R>(WritableData.make(values.length), {
            config,
            childConfig: undefined,
            name: name as string,
        });

        values.forEach((val) => builder.append(val));

        return new Column<any, F>(builder.toVector(), {
            name, version
        });
    }

    /**
     * The field name for the column
    */
    name: N;

    /**
     * The DataType version to use for the field definition
    */
    readonly version: DataTypeVersion;

    readonly vector: Vector<T>;

    constructor(vector: Vector<T>, options: ColumnOptions<N>|Readonly<ColumnOptions<N>>) {
        this.vector = vector;
        this.name = options.name;
        this.version = options.version ?? LATEST_VERSION;
    }

    /**
     * Iterate over each value, this is returned in the stored value format.
     * And may not be compatible with the JSON spec.
    */
    * [Symbol.iterator](): IterableIterator<Maybe<T>> {
        yield* this.vector;
    }

    /**
     * A Unique ID for the Column.
     * The ID should only change if the data vector changes.
    */
    get id(): string {
        return getVectorId(this.vector);
    }

    /**
     * Get the size of the column
    */
    get size(): number {
        return this.vector.size;
    }

    /**
     * Get the Data Type field configuration.
    */
    get config(): Readonly<DataTypeFieldConfig> {
        return this.vector.config;
    }

    /**
     * Rename the column
    */
    rename<K extends NameType>(name: K): Column<T, K> {
        const col = this.fork(this.vector.fork(this.vector.data)) as unknown as Column<T, K>;
        col.name = name;
        // @ts-expect-error
        col.vector.name = name as string;
        return col;
    }

    /**
     * Create a new Column with the same metadata but with different data
    */
    fork(vector: Vector<T>): Column<T, N> {
        return new Column<T, N>(vector, {
            name: this.name,
            version: this.version,
        });
    }

    /**
     * Transform the values with in a column.
     *
     * @note this will always keep the same length
    */
    transform<R, A extends Record<string, any>>(
        transformConfig: ColumnTransformConfig<T, R, A>,
        args?: A
    ): Column<R, N> {
        validateFieldTransformType(
            transformConfig.accepts,
            this.vector
        );
        validateFieldTransformArgs<A>(
            transformConfig.argument_schema,
            transformConfig.required_args,
            args
        );
        const options: ColumnOptions<N> = {
            name: this.name,
            version: this.version,
        };

        const transform = transformConfig.create(
            this.vector, { ...args } as A
        );

        return new Column<R, N>(
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
     * @note this will always keep the same length
    */
    validate<A extends Record<string, any>>(
        validateConfig: ColumnValidateConfig<T, A>,
        args?: A
    ): Column<T, N> {
        validateFieldTransformType(
            validateConfig.accepts,
            this.vector
        );
        validateFieldTransformArgs<A>(
            validateConfig.argument_schema,
            validateConfig.required_args,
            args
        );
        const options: ColumnOptions<N> = {
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

        return new Column<T, N>(
            mapVector<T, T>(this.vector, transform),
            options
        );
    }

    /**
     * Sort the column
    */
    sort(direction?: SortOrder): Column<T, N> {
        const sortedIndices = this.vector.getSortedIndices(direction);
        const len = sortedIndices.length;
        const builder = Builder.make<T>(WritableData.make(len), {
            config: this.vector.config,
            childConfig: this.vector.childConfig,
            name: this.name as string,
        });

        for (let i = 0; i < len; i++) {
            const moveTo = sortedIndices[i];
            const val = this.vector.get(i);
            builder.set(moveTo, val);
        }

        return this.fork(builder.toVector());
    }

    /**
     * Average all of the values in the Column
    */
    avg(): number|bigint {
        return runVectorAggregation(this.vector, ValueAggregation.avg);
    }

    /**
     * Sum all of the values in the Column
    */
    sum(): number|bigint {
        return runVectorAggregation(this.vector, ValueAggregation.sum);
    }

    /**
     * Find the minimum value in the Column
    */
    min(): number|bigint {
        return runVectorAggregation(this.vector, ValueAggregation.min);
    }

    /**
     * Find the maximum value in the Column
    */
    max(): number|bigint {
        return runVectorAggregation(this.vector, ValueAggregation.max);
    }

    /**
     * Convert the Column an array of values (the output is JSON compatible)
     *
     * @note probably only useful for debugging
    */
    toJSON(): Maybe<JSONValue<T>>[] {
        return this.vector.toJSON();
    }

    [Symbol.for('nodejs.util.inspect.custom')](): any {
        const proxy = {
            id: this.id,
            name: this.name,
            vector: this.vector,
            config: this.config,
            size: this.size,
        };

        // Trick so that node displays the name of the constructor
        Object.defineProperty(proxy, 'constructor', {
            value: Column,
            enumerable: false
        });

        return proxy;
    }
}
