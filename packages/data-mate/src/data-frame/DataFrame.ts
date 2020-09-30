import {
    DataTypeConfig, ReadonlyDataTypeConfig,
    Maybe, SortOrder
} from '@terascope/types';
import { times } from '@terascope/utils';
import { Column } from '../column';
import { AggregationFrame } from '../aggregation-frame';
import { columnsToDataTypeConfig, distributeRowsToColumns } from './utils';
import { Builder, getBuildersForConfig } from '../builder';
import { md5 } from '../core-utils';

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
     * The name of the DataFrame
    */
    name?: string;

    /**
     * The list of columns
    */
    readonly columns: readonly Column[];

    /**
     * Metadata about the DataFrame
    */
    readonly metadata: Record<string, any>;

    /** cached id for lazy loading the id */
    private __id?: string;

    protected readonly _size: number;

    constructor(
        columns: Column<any>[]|readonly Column<any>[],
        options?: DataFrameOptions
    ) {
        this.name = options?.name;
        this.metadata = options?.metadata ? { ...options.metadata } : {};

        this.columns = Object.isFrozen(columns)
            ? columns
            : Object.freeze(columns.slice());

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

        const id = md5(long);
        this.__id = id;
        return id;
    }

    /**
     * Create a new DataFrame with the same metadata but with different data
    */
    fork<R extends Record<string, unknown> = T>(
        columns: Column<any>[]|readonly Column<any>[]
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
            (field): Column<any> => this.getColumn(field)!
        ));
    }

    /**
     * Get a column, or columns by index, returns a new DataFrame
    */
    selectAt(...indices: number[]): DataFrame<T> {
        return this.fork(indices.map(
            (index): Column<any> => this.getColumnAt(index)!
        ));
    }

    /**
     * Group DataFrame by columns and return a AggregationFrame instance
     * which can be used to run aggregations
    */
    groupBy(fields: (keyof T)[]): AggregationFrame<T> {
        return new AggregationFrame<T>(this.columns, fields);
    }

    /**
     * Create a AggregationFrame instance which can be used to run aggregations
    */
    aggregate(): AggregationFrame<T> {
        return new AggregationFrame<T>(this.columns, []);
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
        const indices: number[] = [];

        for (let i = 0; i < this._size; i++) {
            let passed = true;
            for (const field in filters) {
                if (Object.prototype.hasOwnProperty.call(filters, field)) {
                    const col = this.getColumn(field)!;
                    const value = col.vector.get(i) as any;

                    if (!filters[field]!(value)) {
                        passed = false;
                        break;
                    }
                }
            }

            if (passed) {
                indices.push(i);
            }
        }

        if (indices.length === this._size) return this;

        const builders = getBuildersForConfig(this.config, indices.length);

        for (const index of indices) {
            for (const col of this.columns) {
                const val = col.vector.get(index);
                builders.get(col.name)!.append(val);
            }
        }

        return this.fork(this.columns.map(
            (col) => col.fork(builders.get(col.name)!.toVector())
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
        Partial<T>[]|Column<T>[]
    )|(
        readonly Partial<T>[]|readonly Column<T>[]
    )): DataFrame<T> {
        if (!arg || !arg.length) return this;

        let len: number;
        if (arg[0] instanceof Column) {
            len = Math.max(
                ...(arg as Column[]).map((col) => col.vector.size)
            );
        } else {
            len = (arg as T[]).length;
        }

        if (!len) return this;

        const builders = new Map<string, Builder>();

        const total = len + this._size;
        for (const col of this.columns) {
            builders.set(
                col.name, Builder.makeFromVector(col.vector, total)
            );
        }

        if (arg[0] instanceof Column) {
            const columns = (arg as Column[]);

            let _indices: number[]|undefined;
            for (const [field, builder] of builders) {
                const col = columns.find(((c) => c.name === field));
                if (col) {
                    for (const [indices, value] of col.vector.values()) {
                        builder.multiSet(indices, value);
                    }

                    const remaining = len - col.size;
                    if (remaining > 0) {
                        builder.multiSet(
                            times(remaining, (n) => n + col.size),
                            null
                        );
                    }
                } else {
                    _indices ??= times(len);
                    builder.multiSet(_indices, null);
                }
            }
        } else {
            for (const record of (arg as T[])) {
                for (const col of this.columns) {
                    const builder = builders.get(col.name)!;
                    builder.append(record[col.name]);
                }
            }
        }

        return this.fork(this.columns.map(
            (col) => col.fork(builders.get(col.name)!.toVector())
        ));
    }

    /**
     * Rename an existing column
    */
    rename<K extends keyof T, R extends string>(
        name: K,
        renameTo: R,
    ): DataFrame<Omit<T, K> & Record<R, T[K]>> {
        return this.fork(this.columns.map((col): Column<any> => {
            if (col.name !== name) return col;
            const newCol = col.fork(col.vector);
            newCol.name = renameTo;
            return newCol;
        }));
    }

    /**
     * Get a column by name
    */
    getColumn<P extends keyof T>(name: P): Column<T[P]>|undefined {
        const index = this.columns.findIndex((col) => col.name === name);
        return this.getColumnAt<P>(index);
    }

    /**
     * Get a column by index
    */
    getColumnAt<P extends keyof T>(index: number): Column<T[P]>|undefined {
        return this.columns[index] as Column<any>|undefined;
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
