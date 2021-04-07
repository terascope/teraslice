import { LATEST_VERSION } from '@terascope/data-types';
import {
    DataTypeFieldConfig, Maybe, DataTypeVersion, SortOrder, DataTypeFields, FieldType
} from '@terascope/types';
import { Builder } from '../builder';
import {
    SerializeOptions, Vector
} from '../vector';
import {
    ColumnConfig,
    ColumnOptions, ColumnTransformConfig, ColumnValidateConfig, TransformMode
} from './interfaces';
import { runVectorAggregation, ValueAggregation } from './aggregations';
import {
    getVectorId, mapVector, validateFieldTransformArgs, validateFieldTransformType
} from './utils';
import { ReadableData, WritableData } from '../core';

type NameType = (number|string|symbol);
/**
 * A single column of values with the same data type.
 *
 * Changing the values is safe as long the length doesn't change.
 * When adding or removing values it is better to create a new Column.
*/
export class Column<T = unknown, N extends NameType = string> {
    /**
     * Create a Column from an array of values
    */
    static fromJSON<R, F extends NameType = string>(
        name: F,
        config: Readonly<DataTypeFieldConfig>,
        values: Maybe<R>[]|readonly Maybe<R>[] = [],
        version?: DataTypeVersion,
        childConfig?: DataTypeFields|Readonly<DataTypeFields>
    ): Column<R, F> {
        const builder = Builder.make<R>(new WritableData(values.length), {
            childConfig,
            config,
            name: name as string,
        });

        values.forEach((val) => builder.append(val));

        return new Column<any, F>(builder.toVector(), {
            name, version
        });
    }

    /**
     * Create a Column from the custom serialized format
    */
    static deserialize<R, F extends NameType = string>(
        columnConfig: Buffer|string
    ): Column<R, F> {
        const config = JSON.parse(columnConfig as string) as ColumnConfig<R>;

        const vector = vectorFromColumnJSON<R>(config);
        return new Column<any, F>(vector, {
            name: config.name as F,
            version: config.version
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

    /**
     * Get the Data Type field configuration.
    */
    readonly config: Readonly<DataTypeFieldConfig>;

    constructor(vector: Vector<T>, options: ColumnOptions<N>|Readonly<ColumnOptions<N>>) {
        this.vector = vector;
        this.name = options.name;
        this.version = options.version ?? LATEST_VERSION;
        this.config = this.vector.config;
    }

    /**
     * Iterate over each value, this is returned in the stored value format.
     * And may not be compatible with the JSON spec.
    */
    * [Symbol.iterator](): IterableIterator<Maybe<T>> {
        yield* this.vector;
    }

    /**
     * Returns the size of the column
    */
    get size(): number {
        return this.vector.size;
    }

    /**
     * A Unique ID for the Column.
     * The ID should only change if the data vector changes.
    */
    get id(): string {
        return getVectorId(this.vector);
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
        const sortedIndices = Vector.getSortedIndices([{
            vector: this.vector,
            direction: direction || 'asc'
        }]);

        const len = sortedIndices.length;
        const builder = Builder.make<T>(new WritableData(len), {
            childConfig: this.vector.childConfig,
            config: this.vector.config,
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
     * Get the unique values. This doesn't change the
     * the size, it just drops the duplicate values.
     * @example
     *   [null, 1, 3, 2, 2, null, 1] => [null, 1, 3, 2, null, null, null]
    */
    unique(): Column<T, N> {
        const writable = new WritableData<T>(this.size);
        for (const [index, value] of this.vector.unique()) {
            writable.set(index, value);
        }
        return this.fork(this.vector.fork([
            new ReadableData(writable)
        ]));
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
     * Select the child fields with in a given vector.
     * This involves recreating the whole column in
     * most cases.
    */
    selectSubFields(fields: Iterable<string>): Column<T, N> {
        if (!this.vector.childConfig) return this;

        const childConfig: DataTypeFields = {};
        for (const field of fields) {
            if (this.vector.childConfig[field]) {
                childConfig[field] = this.vector.childConfig[field];
            }

            // we need to make sure we include
            // the object types
            let parentField = '';
            for (const part of field.split('.')) {
                const dotPrefix = parentField ? '.' : '';
                parentField += `${dotPrefix}${part}`;

                if (this.vector.childConfig[parentField]?.type === FieldType.Object) {
                    childConfig[parentField] = this.vector.childConfig[parentField];
                }
            }
        }

        const existingChildFields = Object.keys(this.vector.childConfig).sort();
        const selectedChildFields = Object.keys(childConfig).sort();

        if (selectedChildFields.join() === existingChildFields.join()) {
            // all of the fields are selected so
            // we don't have to recreate the whole
            // column
            return this;
        }

        const builder = Builder.make<T>(
            new WritableData(this.size),
            {
                config: this.config,
                name: this.name as string,
                childConfig
            }
        );

        for (const value of this.vector) {
            builder.append(value);
        }
        return this.fork(builder.toVector());
    }

    /**
     * Convert the Column an array of values (the output is JSON compatible)
     *
     * @note probably only useful for debugging
    */
    toJSON(options?: SerializeOptions): Maybe<T>[] {
        return this.vector.toJSON(options);
    }

    serialize(): string {
        const column: ColumnConfig<T> = {
            name: `${this.name}`,
            size: this.size,
            version: this.version,
            config: this.vector.config,
            childConfig: this.vector.childConfig,
            values: this.vector.toJSON(),
        };
        return JSON.stringify(column);
    }
}

function vectorFromColumnJSON<T>(
    config: ColumnConfig<T>
): Vector<T> {
    const builder = Builder.make<T>(
        new WritableData(config.size),
        {
            childConfig: config.childConfig,
            config: config.config,
            name: config.name,
        }
    );
    for (const value of config.values) {
        builder.append(value);
    }
    return builder.toVector();
}
