import {
    DataTypeConfig, ReadonlyDataTypeConfig,
    Maybe, SortOrder, FieldType, DataTypeFields, DataTypeFieldConfig
} from '@terascope/types';
import {
    DataEntity, TSError,
    getTypeOf, isFunction,
    isPlainObject, trimFP, matchWildcard
} from '@terascope/utils';
import { Column, KeyAggFn, makeUniqueKeyAgg } from '../column';
import { AggregationFrame } from '../aggregation-frame';
import {
    buildRecords, columnsToBuilderEntries, columnsToDataTypeConfig,
    concatColumnsToColumns, createColumnsWithIndices,
    distributeRowsToColumns, makeKeyForRow, makeUniqueRowBuilder,
    processFieldFilter
} from './utils';
import { Builder, getBuildersForConfig } from '../builder';
import {
    createHashCode, FieldArg, flattenStringArg, freezeArray, getFieldsFromArg, WritableData
} from '../core';
import { getMaxColumnSize } from '../aggregation-frame/utils';
import { ValueToJSONOptions, Vector } from '../vector';

/**
 * An immutable columnar table with APIs for data pipelines.
 *
 * @note null/undefined values are treated the same
*/
export class DataFrame<
    T extends Record<string, unknown> = Record<string, any>,
> {
    /**
     * Create a DataFrame from an array of JSON objects
    */
    static fromJSON<
        R extends Record<string, unknown> = Record<string, any>,
    >(
        config: DataTypeConfig|ReadonlyDataTypeConfig,
        records: R[] = [],
        options?: DataFrameOptions
    ): DataFrame<R> {
        const columns = distributeRowsToColumns(config, records);
        return new DataFrame(columns, options);
    }

    /**
     * The name of the Frame
    */
    name?: string;

    /**
     * The list of columns
    */
    readonly columns: readonly Column<any, keyof T>[];

    /**
     * An array of the column names
    */
    readonly fields: readonly (keyof T)[];

    /**
     * Metadata about the Frame
    */
    readonly metadata: Record<string, any>;

    /** cached id for lazy loading the id */
    #id?: string;

    readonly size: number;

    constructor(
        columns: Column<any, keyof T>[]|readonly Column<any, keyof T>[],
        options?: DataFrameOptions
    ) {
        this.name = options?.name;
        this.metadata = options?.metadata ? { ...options.metadata } : {};

        this.columns = freezeArray(columns);
        this.fields = Object.freeze(this.columns.map((col) => col.name));

        const lengths = this.columns.map((col) => col.size);
        if (new Set(lengths).size > 1) {
            throw new Error(
                'All columns for a DataFrame must have the same length'
            );
        }
        this.size = lengths[0] ?? 0;
    }

    /**
     * Iterate over each row, this returns the JSON compatible values.
    */
    * [Symbol.iterator](): IterableIterator<T> {
        yield* this.rows(true);
    }

    /**
     * Iterate over each index and row, this returns the internal stored values.
    */
    * entries(
        json?: boolean, options?: ValueToJSONOptions
    ): IterableIterator<[index: number, row: T]> {
        for (let i = 0; i < this.size; i++) {
            const row = this.getRow(i, json, options);
            if (row) yield [i, row];
        }
    }

    /**
     * Iterate each row
    */
    * rows(json?: boolean, options?: ValueToJSONOptions): IterableIterator<T> {
        for (let i = 0; i < this.size; i++) {
            const row = this.getRow(i, json, options);
            if (row) yield row;
        }
    }

    /**
     * A Unique ID for the DataFrame
     * The ID will only change if the columns or data change
    */
    get id(): string {
        if (this.#id) return this.#id;

        const long = this.columns
            .map((col) => `${col.name}(${col.id})`)
            .sort()
            .join(':');

        const id = createHashCode(long) as string;
        this.#id = id;
        return id;
    }

    /**
     * Create a new DataFrame with the same metadata but with different data
    */
    fork<R extends Record<string, unknown> = T>(
        columns: Column<any, keyof R>[]|readonly Column<any, keyof R>[]
    ): DataFrame<R> {
        return new DataFrame<R>(columns, {
            name: this.name,
            metadata: this.metadata,
        });
    }

    /**
     * Generate the DataType config from the columns.
    */
    get config(): DataTypeConfig {
        return columnsToDataTypeConfig(this.columns);
    }

    /**
     * Get a column, or columns by name, returns a new DataFrame
    */
    select<K extends keyof T>(...fieldArg: FieldArg<K>[]): DataFrame<Pick<T, K>> {
        const fields = [...getFieldsFromArg(this.fields, fieldArg)];
        return this.fork(fields.map(
            (field): Column<any, any> => this.getColumnOrThrow(field)
        ));
    }

    /**
     * Select fields in a data frame, this will work with nested object
     * fields and the selection field can also include wildcards which will match
     * a large selection of string.
     *
     * Fields that don't exist in the data frame are safely ignored to make
     * this function handle more suitable for production environments
    */
    deepSelect<R extends T>(
        fieldSelectors: string[]|readonly string[]
    ): DataFrame<R> {
        const columns: Column<any, any>[] = [];

        const existingFieldsConfig = this.config.fields;
        const existingFields = Object.keys(existingFieldsConfig);

        const matchedFields: Record<string, Set<string>> = {};
        function matchField(field: string) {
            return (selector: string): boolean => {
                if (field === selector) return true;
                if (field.startsWith(`${selector}.`)) return true;
                if (selector.includes('*')) {
                    return matchWildcard(selector, field);
                }
                return false;
            };
        }

        for (const field of existingFields) {
            const matches = fieldSelectors.some(matchField(field));
            if (matches) {
                const [base] = field.split('.');
                matchedFields[base] ??= new Set();
                if (field !== base) {
                    matchedFields[base].add(
                        // only store the scoped field
                        // because it is easier to look
                        // it up in the childConfig that way
                        field.replace(`${base}.`, '')
                    );
                }
            }
        }

        for (const [field, childFields] of Object.entries(matchedFields)) {
            const col = this.getColumn(field);
            if (col) {
                if (childFields.size && col.vector.childConfig) {
                    columns.push(col.selectSubFields([...childFields]));
                } else {
                    columns.push(col);
                }
            }
        }

        return this.fork<R>(columns);
    }

    /**
     * Get a column, or columns by index, returns a new DataFrame
    */
    selectAt<R extends Record<string, unknown> = T>(...indices: number[]): DataFrame<R> {
        return this.fork(indices.map(
            (index): Column<any, any> => this.getColumnAt(index)!
        ));
    }

    /**
     * Create a AggregationFrame instance which can be used to run aggregations
    */
    aggregate(): AggregationFrame<T> {
        return new AggregationFrame<T>(this.columns, {
            name: this.name,
            metadata: this.metadata,
        });
    }

    /**
     * Order the rows by fields, format of is `field:asc` or `field:desc`.
     * Defaults to `asc` if none specified
    */
    orderBy(...fieldArgs: FieldArg<string>[]): DataFrame<T>;
    orderBy(...fieldArgs: FieldArg<keyof T>[]): DataFrame<T>;
    orderBy(...fieldArgs: (FieldArg<keyof T>[]|FieldArg<string>[])): DataFrame<T> {
        const fields = flattenStringArg(fieldArgs);
        const sortBy = [...fields].map(
            (fieldArg): { field: keyof T; vector: Vector<any>; direction: SortOrder } => {
                const [field, direction = 'asc'] = `${fieldArg}`.split(':').map(trimFP());
                if (direction !== 'asc' && direction !== 'desc') {
                    throw new TSError(
                        `Expected direction ("${direction}") for orderBy field ("${field}") to be either "asc" or "desc"`,
                        { context: { safe: true }, statusCode: 400 }
                    );
                }
                return {
                    field: field as keyof T,
                    direction: direction as SortOrder,
                    vector: this.getColumnOrThrow(field).vector,
                };
            }
        );

        const sortedIndices = Vector.getSortedIndices(sortBy);

        const len = sortedIndices.length;
        const builders = getBuildersForConfig<T>(this.config, len);

        for (let i = 0; i < len; i++) {
            const moveTo = sortedIndices[i];
            for (const col of this.columns) {
                const val = col.vector.get(i);
                builders.get(col.name)!.set(moveTo, val);
            }
        }

        return this.fork(this.columns.map(
            (col) => col.fork(builders.get(col.name)!.toVector())
        ));
    }

    /**
     * Sort the records by a field, an alias of orderBy.
     *
     * @see orderBy
    */
    sort(...fieldArgs: FieldArg<string>[]): DataFrame<T>;
    sort(...fieldArgs: FieldArg<keyof T>[]): DataFrame<T>;
    sort(...fieldArgs: (FieldArg<keyof T>[]|FieldArg<string>[])): DataFrame<T> {
        return this.orderBy(...fieldArgs);
    }

    /**
     * Require specific columns to exist on every row
    */
    require(...fieldArg: FieldArg<keyof T>[]): DataFrame<T> {
        const fields = getFieldsFromArg(this.fields, fieldArg);
        const hasRequiredFields = [...fields].reduce(
            (acc, field): FilterByFn<T> => {
                if (!acc) return (row: T) => row[field] != null;
                return (row: T, index: number) => {
                    if (!acc(row, index)) return false;
                    return row[field] != null;
                };
            },
            undefined as FilterByFn<T>|undefined
        )!;
        return this._filterByFn(hasRequiredFields, false);
    }

    /**
     * Filter the DataFrame by fields, all fields must return true
     * for a given row to returned in the filtered DataType
     *
     * @example
     *
     *     dataFrame.filter({
     *         name(val) {
     *             return val != null;
     *         },
     *         age(val) {
     *             return val != null && val >= 20;
     *         }
     *     });
    */
    filterBy(filters: FilterByFields<T>|FilterByFn<T>, json?: boolean): DataFrame<T> {
        if (isFunction(filters)) {
            return this._filterByFn(filters, json ?? false);
        }
        return this._filterByFields(filters, json ?? false);
    }

    private _filterByFields(filters: FilterByFields<T>, json: boolean): DataFrame<T> {
        const indices = new Set<number>();

        Object.entries(filters).forEach(([field, filter]) => {
            processFieldFilter(
                indices, this.getColumnOrThrow(field), filter, json
            );
        });

        if (indices.size === this.size) return this;
        return this.fork(createColumnsWithIndices(
            this.columns,
            indices,
            indices.size
        ));
    }

    private _filterByFn(fn: FilterByFn<T>, json: boolean): DataFrame<T> {
        const records: T[] = [];
        for (const [index, row] of this.entries(json)) {
            if (fn(row, index)) records.push(row);
        }

        if (records.length === this.size) return this;

        return this.fork(
            distributeRowsToColumns(this.config, records)
        );
    }

    /**
     * Remove duplicate rows with the same value for select fields
    */
    unique(...fieldArg: FieldArg<keyof T>[]): DataFrame<T> {
        const fields = getFieldsFromArg(this.fields, fieldArg);
        const buckets = new Set<string>();
        const keyAggs = new Map<keyof T, KeyAggFn>();

        const columns = new Map(this.columns.map((col) => [col.name, col]));
        for (const name of fields) {
            const column = columns.get(name)!;
            if (column) {
                keyAggs.set(column.name, makeUniqueKeyAgg(column.vector));
            }
        }

        const builders = getBuildersForConfig<T>(this.config, this.size);

        const rowBuilder = makeUniqueRowBuilder(
            builders,
            buckets,
            (name, i) => columns.get(name)!.vector.get(i)
        );

        for (let i = 0; i < this.size; i++) {
            const res = makeKeyForRow(keyAggs, i);
            if (res && !buckets.has(res.key)) {
                rowBuilder(res.row, res.key, i);
            }
        }

        return this.fork([...builders].map(([name, builder]: [keyof T, Builder<any>]) => {
            // @ts-expect-error data is readonly
            builder.data = builder.data.resize(buckets.size);
            return columns.get(name)!.fork(builder.toVector());
        }));
    }

    /**
     * Alias for unique
    */
    distinct(...fieldArg: FieldArg<keyof T>[]): DataFrame<T> {
        return this.unique(...fieldArg);
    }

    /**
     * Assign new columns to a new DataFrame. If given a column already exists,
     * the column will replace the existing one.
    */
    assign<R extends Record<string, unknown> = Record<string, any>>(
        columns: readonly Column<any>[]
    ): DataFrame<T & R> {
        const newColumns = columns.filter((col) => {
            if (this.getColumn(col.name)) return false;
            return true;
        });

        return this.fork<T & R>(
            this.columns.map((col) => {
                const replaceCol = columns.find((c) => c.name === col.name);
                if (replaceCol) return replaceCol;
                return col;
            }).concat(newColumns) as Column<any>[],
        );
    }

    /**
     * Concat rows, or columns, to the end of the existing Columns
    */
    concat(arg: (
        Partial<T>[]|Column<any, keyof T>[]
    )|(
        readonly Partial<T>[]|readonly Column<any, keyof T>[]
    )): DataFrame<T> {
        if (!arg?.length) return this;

        const isColumns = arg[0] instanceof Column;
        let len: number;
        if (isColumns) {
            len = getMaxColumnSize(arg as Column[]);
        } else {
            const valid = DataEntity.isDataEntity(arg[0]) || isPlainObject(arg[0]);
            if (!valid) {
                throw new Error(
                    `Unexpected input given to DataFrame.concat, got ${getTypeOf(arg[0])}`
                );
            }
            len = (arg as T[]).length;
        }

        if (!len) return this;

        const builders = new Map<keyof T, Builder>(
            columnsToBuilderEntries(this.columns, len + this.size)
        );

        const finish = ([name, builder]: [keyof T, Builder<any>]) => (
            this.getColumnOrThrow(name).fork(builder.toVector())
        );

        if (isColumns) {
            return this.fork(
                concatColumnsToColumns(
                    builders,
                    arg as Column<any, keyof T>[],
                    this.size,
                ).map(finish)
            );
        }
        return this.fork(
            buildRecords<T>(builders, arg as T[]).map(finish)
        );
    }

    /**
     * Rename an existing column
    */
    rename<K extends keyof T, R extends string>(
        name: K,
        renameTo: R,
    ): DataFrame<Omit<T, K> & Record<R, T[K]>> {
        return this.fork(this.columns.map((col): Column<any, any> => {
            if (col.name !== name) return col;
            return col.rename(renameTo);
        }));
    }

    /**
     * Merge two or more columns into a Tuple
    */
    createTupleFrom<R extends string, V = [...unknown[]]>(
        fields: readonly (keyof T)[],
        as: R
    ): DataFrame<T & Record<R, V>> {
        if (!fields.length) {
            throw new TSError('Tuples require at least one field', {
                statusCode: 400
            });
        }
        const columns = fields.map((field) => this.getColumnOrThrow(field));
        const childConfig: DataTypeFields = {};
        columns.forEach((col, index) => {
            childConfig[`${as}.${index}`] = col.config;
        });

        const config: DataTypeFieldConfig = Object.freeze({ type: FieldType.Tuple });
        const builder = Builder.make<V>(new WritableData(this.size), {
            childConfig,
            config,
            name: as as string
        });

        for (let index = 0; index < this.size; index++) {
            builder.set(index, columns.map((col) => col.vector.get(index, false)));
        }

        const column = new Column(builder.toVector(), {
            name: as,
            version: columns[0].version,
        });
        return this.assign([column]);
    }

    /**
     * Get a column by name
    */
    getColumn<P extends keyof T>(field: P): Column<T[P], P>|undefined {
        const index = this.columns.findIndex((col) => col.name === field);
        return this.getColumnAt<P>(index);
    }

    /**
     * Get a column by name or throw if not found
    */
    getColumnOrThrow<P extends keyof T>(field: P): Column<T[P], P> {
        const column = this.getColumn(field);
        if (!column) {
            throw new Error(`Unknown column ${field} in ${
                this.name ? ` ${this.name}` : ''
            } ${this.constructor.name}`);
        }
        return column;
    }

    /**
     * Get a column by index
    */
    getColumnAt<P extends keyof T>(index: number): Column<T[P], P>|undefined {
        return this.columns[index] as Column<any, P>|undefined;
    }

    /**
     * Get a row by index, if the row has only null values, returns undefined
    */
    getRow(index: number, json = false, options?: ValueToJSONOptions): T|undefined {
        if (index > (this.size - 1)) return;
        const nilValue: any = options?.useNullForUndefined ? null : undefined;

        const row: Partial<T> = {};
        let numKeys = 0;
        for (const col of this.columns) {
            const field = col.name as keyof T;
            const val = col.vector.get(
                index, json, options
            ) as Maybe<T[keyof T]>;

            if (val != null) {
                numKeys++;
                row[field] = val;
            } else if (nilValue === null) {
                row[field] = nilValue;
            }
        }

        if (options?.skipEmptyObjects && !numKeys) {
            return nilValue;
        }

        return row as T;
    }

    /**
     * Reduce amount of noise in a DataFrame,
     * by removing the amount of duplicates and
     * dropping nil fields
    */
    compact(): DataFrame<T> {
        return this;
    }

    /**
     * Returns a DataFrame with a limited number of rows
    */
    limit(num: number): DataFrame<T> {
        let start: number|undefined;
        let end: number|undefined;
        if (num < 0) {
            start = num;
        } else {
            end = num;
        }
        if (start == null && end != null && end > this.size) {
            return this;
        }
        return this.fork(this.columns.map(
            (col) => col.fork(col.vector.slice(start, end))
        ));
    }

    /**
     * Convert the DataFrame an array of objects (the output is JSON compatible)
    */
    toJSON(options?: ValueToJSONOptions): T[] {
        return Array.from(this.rows(true, options));
    }

    /**
     * Convert the DataFrame an array of objects (the output may not be JSON compatible)
    */
    toArray(): T[] {
        return Array.from(this.rows(false));
    }
}

/**
 * DataFrame options
*/
export interface DataFrameOptions {
    name?: string;
    metadata?: Record<string, any>;
}

export type FilterByFields<T> = Partial<{
    [P in keyof T]: (value: Maybe<T[P]>) => boolean
}>;

export type FilterByFn<T> = (row: T, index: number) => boolean;
