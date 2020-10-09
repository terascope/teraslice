import {
    DataTypeConfig, ReadonlyDataTypeConfig,
    Maybe, SortOrder
} from '@terascope/types';
import { castArray } from '@terascope/utils';
import { Column } from '../column';
import { AggregationFrame } from '../aggregation-frame';
import {
    buildRecords, columnsToBuilderEntries, columnsToDataTypeConfig,
    concatColumnsToColumns, createColumnsWithIndices, distributeRowsToColumns, processFieldFilter
} from './utils';
import { Builder, getBuildersForConfig } from '../builder';
import { createHashCode, freezeArray } from '../core';
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
    select<K extends keyof T>(...fields: K[]): DataFrame<Pick<T, K>> {
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
     * Group DataFrame by columns and return a AggregationFrame instance
     * which can be used to run aggregations
    */
    groupBy(fields: (keyof T)[]|keyof T): AggregationFrame<T> {
        const aggregationFrame = this.aggregate();
        for (const field of castArray(fields)) {
            aggregationFrame.unique(field);
        }
        return aggregationFrame;
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
    orderBy(field: keyof T, direction?: SortOrder): DataFrame<T> {
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
    sort(field: keyof T, direction?: SortOrder): DataFrame<T> {
        return this.orderBy(field, direction);
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
    getColumn<P extends keyof T>(name: P): Column<T[P], P>|undefined {
        const index = this.columns.findIndex((col) => col.name === name);
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
