import {
    DataTypeConfig, ReadonlyDataTypeConfig,
    Maybe, SortOrder
} from '@terascope/types';
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
    createHashCode, FieldArg, freezeArray, getFieldsFromArg
} from '../core';
import { getMaxColumnSize } from '../aggregation-frame/utils';

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
        return new DataFrame(columns, {
            ...options,
        });
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
    private __id?: string;

    protected readonly _size: number;

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
        this._size = lengths[0] ?? 0;
    }

    /**
     * Iterate over each row, this returns the JSON compatible values.
    */
    * [Symbol.iterator](): IterableIterator<T> {
        for (let i = 0; i < this._size; i++) {
            const row = this.getRow(i, true);
            if (row) yield row;
        }
    }

    /**
     * A Unique ID for the DataFrame
     * The ID will only change if the columns or data change
    */
    get id(): string {
        if (this.__id) return this.__id;

        const long = this.columns
            .map((col) => `${col.name}(${col.id})`)
            .sort()
            .join(':');

        const id = createHashCode(long) as string;
        this.__id = id;
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
     * Get the number of records in the DataFrame
    */
    get size(): number {
        return this._size;
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
            (field): Column<any, any> => this.getColumn(field)!
        ));
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
    orderBy(fieldArg: FieldArg<keyof T>, direction?: SortOrder): DataFrame<T> {
        const fields = getFieldsFromArg(this.fields, [fieldArg]);
        if (fields.size > 1) {
            throw new Error('DataFrame.orderBy can only works with one field currently');
        }

        const [field] = fields;
        const sortColumn = this.getColumn(field);
        if (!sortColumn) throw new Error(`Unknown column ${field}`);

        const sortedIndices = sortColumn.vector.getSortedIndices(direction);

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
    sort(fieldArg: FieldArg<keyof T>, direction?: SortOrder): DataFrame<T> {
        return this.orderBy(fieldArg, direction);
    }

    /**
     * Filter the DataFrame by fields, all fields must return true
     * for a given row to returned in the filtered DataType
     *
     * @todo support filtering rows via a single function
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
    filterBy(filters: FilterByFields<T>): DataFrame<T> {
        const indices = new Set<number>();

        for (const [field, filter] of Object.entries(filters)) {
            processFieldFilter(
                indices, this.getColumn(field)!, filter
            );
        }

        if (indices.size === this._size) return this;
        return this.fork(createColumnsWithIndices(
            this.columns,
            indices,
            indices.size
        ));
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
            const column = columns.get(name);
            if (column) {
                keyAggs.set(column.name, makeUniqueKeyAgg(column.vector));
            } else {
                throw new Error(`Unknown column ${name}`);
            }
        }

        const builders = getBuildersForConfig<T>(this.config, this.size);

        const rowBuilder = makeUniqueRowBuilder(
            builders,
            buckets,
            (name, i) => columns.get(name)!.vector.get(i)
        );

        for (let i = 0; i < this._size; i++) {
            const res = makeKeyForRow(keyAggs, i);
            if (res && !buckets.has(res.key)) {
                rowBuilder(res.row, res.key, i);
            }
        }

        return this.fork([...builders].map(([name, builder]: [keyof T, Builder<any>]) => {
            builder.data.resize(buckets.size, true);
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

        let len: number;
        if (arg[0] instanceof Column) {
            len = getMaxColumnSize(arg as Column[]);
        } else {
            len = (arg as T[]).length;
        }

        if (!len) return this;

        const builders = new Map<keyof T, Builder>(
            columnsToBuilderEntries(this.columns, len + this._size)
        );

        const finish = ([name, builder]: [keyof T, Builder<any>]) => (
            this.getColumn(name)!.fork(builder.toVector())
        );

        if (arg[0] instanceof Column) {
            return this.fork(
                concatColumnsToColumns(
                    builders,
                    arg as Column<any, keyof T>[],
                    this._size,
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
     * Get a column by name
    */
    getColumn<P extends keyof T>(field: P): Column<T[P], P>|undefined {
        const index = this.columns.findIndex((col) => col.name === field);
        return this.getColumnAt<P>(index);
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
    getRow(index: number, json = false): T|undefined {
        if (index > (this._size - 1)) return;

        const row: Partial<T> = {};
        for (const col of this.columns) {
            const field = col.name as keyof T;
            const val = col.vector.get(
                index, json
            ) as Maybe<T[keyof T]>;

            if (val != null) {
                row[field] = val;
            }
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
        return this.fork(this.columns.map(
            (col) => col.fork(col.vector.slice(start, end))
        ));
    }

    /**
     * Convert the DataFrame an array of object (the output is JSON compatible)
    */
    toJSON(): T[] {
        return [...this];
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
