import difference from 'lodash/difference';
import {
    DataTypeConfig, ReadonlyDataTypeConfig,
    Maybe, SortOrder, FieldType,
    DataTypeFields, DataTypeFieldConfig,
    xLuceneVariables,
} from '@terascope/types';
import {
    DataEntity, TSError,
    getTypeOf, isFunction,
    isPlainObject, trimFP,
    isInteger,
    joinList
} from '@terascope/utils';
import {
    Column, KeyAggFn, makeUniqueKeyAgg
} from '../column';
import { AggregationFrame } from '../aggregation-frame';
import {
    buildRecords, columnsToBuilderEntries, columnsToDataTypeConfig,
    concatColumnsToColumns, createColumnsWithIndices,
    distributeRowsToColumns, isEmptyRow, makeKeyForRow, makeUniqueRowBuilder,
    processFieldFilter
} from './utils';
import { Builder, getBuildersForConfig } from '../builder';
import {
    createHashCode, FieldArg, flattenStringArg,
    freezeArray, getFieldsFromArg, getHashCodeFrom,
    ReadableData,
    WritableData,
} from '../core';
import { getMaxColumnSize } from '../aggregation-frame/utils';
import { SerializeOptions, Vector } from '../vector';
import { buildSearchMatcherForQuery } from './search-utils';
import { DataFrameHeaderConfig } from './interfaces';
import { convertMetadataFromJSON, convertMetadataToJSON } from './metadata-utils';

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
     * Create an empty DataFrame
    */
    static empty<
        R extends Record<string, unknown> = Record<string, any>,
    >(
        config: DataTypeConfig|ReadonlyDataTypeConfig,
        options?: DataFrameOptions
    ): DataFrame<R> {
        const columns = distributeRowsToColumns<R>(config, []);
        return new DataFrame(columns, options);
    }

    /**
     * Create a DataFrame from a serialized format,
     * the first row is data frame metadata,
     * all of the subsequent rows are serialized columns.
     *
     * When using this method, the input should be split by a new line.
    */
    static async deserializeIterator<
        R extends Record<string, unknown> = Record<string, any>,
    >(data: Iterable<Buffer|string>|AsyncIterable<Buffer|string>): Promise<DataFrame<R>> {
        let index = -1;

        let metadata: Record<string, unknown>|undefined;
        let name: string|undefined;
        const columns: Column<any, keyof R>[] = [];

        for await (const row of data) {
            // ensure empty rows don't get passed along
            if (!row.length || row.toString() === '\n') continue;

            index++;
            if (index === 0) {
                ({ metadata, name } = JSON.parse(row as string) as DataFrameHeaderConfig);
                metadata = convertMetadataFromJSON(metadata ?? {});
            } else {
                columns.push(Column.deserialize(row));
            }
        }

        return new DataFrame<R>(columns, {
            name,
            metadata
        });
    }

    /**
     * Create a DataFrame from a serialized format,
     * the first row is data frame metadata,
     * all of the subsequent rows are serialized columns.
     * The rows should be joined with a newline.
     *
     * When using this method, the whole serialized file should be
     * passed in.
     *
     * For a more advanced steam like processing, see {@see DataFrame.deserializeIterator}
     * Using that method may be required for deserializing a buffer or string
     * greater than 1GB.
    */
    static async deserialize<
        R extends Record<string, unknown> = Record<string, any>,
    >(data: Buffer|string): Promise<DataFrame<R>> {
        return DataFrame.deserializeIterator(
            data.toString('utf8').split('\n')
        );
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

    /**
     * Size of the DataFrame
    */
    readonly size: number;

    /** cached id for lazy loading the id */
    #id?: string;

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
                `All columns for a DataFrame must have the same length, got ${joinList(lengths)}`
            );
        }
        this.size = lengths[0] ?? 0;

        if (!isInteger(this.size)) {
            throw new Error(`Invalid size given to DataFrame, got ${this.size} (${getTypeOf(this.size)})`);
        }
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
        json?: boolean, options?: SerializeOptions
    ): IterableIterator<[index: number, row: T]> {
        for (let i = 0; i < this.size; i++) {
            const row = this.getRow(i, json, options);
            if (row) yield [i, row];
        }
    }

    /**
     * Iterate each row
    */
    * rows(json?: boolean, options?: SerializeOptions): IterableIterator<T> {
        if (options?.skipDuplicateObjects) {
            yield* this.rowsWithoutDuplicates(json, options);
            return;
        }

        for (let i = 0; i < this.size; i++) {
            const row = this.getRow(i, json, options);
            if (row) yield row;
        }
    }

    /**
     * This is more expensive and little more complicated.
     * In the future we pass in json=false to each column and
     * the call valueToJSON after each generating the hash
     * to be consistent with hash
    */
    private* rowsWithoutDuplicates(
        json?: boolean, options?: SerializeOptions
    ): IterableIterator<T> {
        const hashes = new Set<string>();
        for (let i = 0; i < this.size; i++) {
            const row = this.getRow(i, json, options);
            if (row) {
                const hash = getHashCodeFrom(row);
                if (!hashes.has(hash)) {
                    hashes.add(hash);
                    yield row;
                }
            }
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

        const id = createHashCode(long);
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
     * fields.
     *
     * Fields that don't exist in the data frame are safely ignored to make
     * this function handle more suitable for production environments
    */
    deepSelect<R extends T>(
        fieldSelectors: string[]|readonly string[],
    ): DataFrame<R> {
        const columns: Column<any, any>[] = [];

        const existingFieldsConfig = this.config.fields;
        const existingFields = Object.keys(existingFieldsConfig);

        const matchedFields: Record<string, Set<string>> = Object.create(null);

        for (const field of existingFields) {
            const matches = fieldSelectors.some((selector) => {
                if (field === selector) return true;
                if (field.startsWith(`${selector}.`)) {
                    const baseConfig = existingFieldsConfig[selector];
                    if (!baseConfig?._allow_empty) return true;
                }
                return false;
            });

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
                columns.push(col.selectSubFields(
                    childFields,
                ));
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
     * Search the DataFrame using an xLucene query
    */
    search(query: string, variables?: xLuceneVariables): DataFrame<T> {
        const matcher = buildSearchMatcherForQuery(this, query, variables);
        return this.filterBy(matcher);
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
     * Remove the empty rows from the data frame,
     * this is optimization that won't require moving
     * around as much memory
    */
    removeEmptyRows(): DataFrame<T> {
        const len = this.size;
        let returning = len;
        const builders = getBuildersForConfig<T>(this.config, len);
        const columns = new Map(this.columns.map((col) => [col.name, col]));

        for (let i = 0; i < len; i++) {
            if (isEmptyRow(this.columns, i)) {
                returning--;
            } else {
                for (const [name, builder] of builders) {
                    builder.append(columns.get(name)!.vector.get(i));
                }
            }
        }

        if (returning === this.size) return this;

        return this.fork([...builders].map(([name, builder]: [keyof T, Builder<any>]) => {
        // @ts-expect-error data is readonly
            builder.data = builder.data
                .resize(returning);
            return columns.get(name)!.fork(builder.toVector());
        }));
    }

    /**
     * Remove duplicate rows with the same value for select fields
    */
    unique(...fieldArg: FieldArg<keyof T>[]): DataFrame<T> {
        return this._unique(
            getFieldsFromArg(this.fields, fieldArg)
        );
    }

    /**
     * Alias for unique
    */
    distinct(...fieldArg: FieldArg<keyof T>[]): DataFrame<T> {
        return this.unique(...fieldArg);
    }

    /**
     * Like unique but will allow passing serialization options
    */
    private _unique(
        fields: Iterable<keyof T>,
        serializeOptions?: SerializeOptions
    ): DataFrame<T> {
        const buckets = new Set<string>();
        const keyAggs = new Map<keyof T, KeyAggFn>();

        const columns = new Map(this.columns.map((col) => [col.name, col]));
        for (const name of fields) {
            const column = columns.get(name)!;
            if (column) {
                keyAggs.set(column.name, makeUniqueKeyAgg(
                    column.vector, serializeOptions
                ));
            }
        }

        const builders = getBuildersForConfig<T>(this.config, this.size);

        const rowBuilder = makeUniqueRowBuilder(
            builders,
            buckets,
            (name, i) => {
                if (!serializeOptions) {
                    return columns.get(name)!.vector.get(i);
                }
                return columns.get(name)!.vector.get(
                    i, true, serializeOptions
                );
            }
        );

        for (let i = 0; i < this.size; i++) {
            const res = makeKeyForRow(keyAggs, i);
            if (res && !buckets.has(res.key)) {
                rowBuilder(res.row, res.key, i);
            }
        }

        return this.fork([...builders].map(([name, builder]: [keyof T, Builder<any>]) => {
            // @ts-expect-error data is readonly
            builder.data = builder.data
                .resize(buckets.size);
            return columns.get(name)!.fork(builder.toVector());
        }));
    }

    /**
     * Reduce amount of noise in a DataFrame by
     * removing the amount of duplicates, including
     * duplicate objects in array values
    */
    compact(): DataFrame<T> {
        const serializeOptions: SerializeOptions = {
            skipDuplicateObjects: true,
            skipEmptyObjects: true,
            skipNilValues: true,
            skipNilObjectValues: true,
        };

        return this._unique(this.fields, serializeOptions);
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

        const finish = ([name, builder]: [keyof T, Builder<any>]): Column<T[keyof T], keyof T> => (
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
     * Append one or more data frames to the end of this DataFrame.
     * Useful for incremental building an DataFrame since the cost of
     * this is relatively low.
     *
     * This is more efficient than using DataFrame.concat but comes with less
     * data type checking and may less safe so use with caution
    */
    appendAll(frames: Iterable<DataFrame<T>>, limit?: number): DataFrame<T> {
        let { size } = this;

        for (const frame of frames) {
            if (limit != null && size >= limit) {
                break;
            }
            size += frame.size;
        }

        if (limit != null && size > limit) {
            size = limit;
        }

        // nothing changed
        if (size === this.size) return this;
        if (size < this.size || size === 0) {
            return this.limit(size);
        }

        let currIndex = this.size;
        const columns = this.columns.slice();
        const fields = this.fields.slice();

        function addMissing(frame: DataFrame<T>) {
            const missing = difference(fields, frame.fields);
            for (const field of missing) {
                const colIndex = columns.findIndex((c) => c.name === field)!;
                const existingColumn = columns[colIndex];
                // ensure that we create a vector with correct
                // starting length
                const vector = existingColumn.vector.append(
                    [new ReadableData(new WritableData(currIndex))]
                );
                columns[colIndex] = existingColumn.fork(vector);
            }
        }

        /**
         * @returns the column index
        */
        function appendNewColumn(column: Column<any, keyof T>): number {
            // ensure that we create a vector with correct
            // starting length
            const backfillVector = column.vector.fork(
                [new ReadableData(new WritableData(currIndex))]
            );
            const newColumn = column.fork(backfillVector);
            fields.push(newColumn.name);
            // subtract one from the new length
            return (columns.push(newColumn) - 1);
        }

        for (const frame of frames) {
            const remaining = size - currIndex;
            // no need to process more frames
            if (remaining <= 0) break;

            addMissing(frame);

            for (const column of frame.columns) {
                let colIndex = columns.findIndex((c) => c.name === column.name);
                if (colIndex === -1) {
                    colIndex = appendNewColumn(column);
                }

                let { vector } = column;
                if (remaining < vector.size) {
                    vector = vector.slice(0, remaining);
                }

                const existingColumn = columns[colIndex];
                columns[colIndex] = existingColumn.fork(
                    existingColumn.vector.append(vector.data)
                );
            }

            currIndex += frame.size;
        }

        return this.fork(columns);
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
        const childConfig: DataTypeFields = Object.create(null);
        columns.forEach((col, index) => {
            childConfig[index] = col.config;
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
            throw new Error(`Unknown column ${field} in${
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
    getRow(
        index: number,
        json = false,
        options?: SerializeOptions,
    ): T|undefined {
        if (index > (this.size - 1)) return;
        const nilValue: any = options?.useNullForUndefined ? null : undefined;

        const row: Partial<T> = Object.create(null);
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
    toJSON(options?: SerializeOptions): T[] {
        return Array.from(this.rows(true, options));
    }

    /**
     * Convert the DataFrame an array of objects (the output may not be JSON compatible)
    */
    toArray(): T[] {
        return Array.from(this.rows(false));
    }

    /**
     * Converts the DataFrame into an optimized serialized format,
     * including the metadata. This returns an iterator and requires
     * external code to join yield chunks with a new line.
     *
     * There is 1GB limit per column using this method
    */
    * serializeIterator(): Iterable<string> {
        const dataFrameConfig: DataFrameHeaderConfig = {
            v: 1,
            name: this.name,
            size: this.size,
            metadata: convertMetadataToJSON(this.metadata),
            config: this.config
        };
        yield JSON.stringify(dataFrameConfig);

        for (const column of this.columns) {
            yield column.serialize();
        }
    }

    /**
     * Converts the DataFrame into an optimized serialized format,
     * including the metadata. This returns a string that includes
     * the data frame header and all of columns joined with a new line.
     *
     * There is 1GB limit for the whole data frame using this method,
     * to achieve a 1GB limit per column, use {@see serializeIterator}
    */
    serialize(): string {
        return Array.from(this.serializeIterator()).join('\n');
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
