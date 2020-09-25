import {
    DataTypeConfig, ReadonlyDataTypeConfig,
    Maybe, SortOrder
} from '@terascope/types';
import { Column } from '../column';
import { AggregationFrame } from '../aggregation-frame';
import { md5 } from '../vector/utils';
import { columnsToDataTypeConfig, distributeRowsToColumns } from './utils';
import { Builder, getBuildersForConfig } from '../builder';

/**
 * An immutable columnar table with APIs for data pipelines.
 *
 * @todo Add conventionally metadata
*/
export class DataFrame<
    T extends Record<string, unknown> = Record<string, any>,
    M extends Record<string, unknown> = Record<string, any>
> {
    /**
     * Create a DataFrame from an array of JSON objects
    */
    static fromJSON<
        R extends Record<string, unknown> = Record<string, any>,
        D extends Record<string, unknown> = Record<string, any>
    >(
        config: DataTypeConfig|ReadonlyDataTypeConfig,
        records: R[] = [],
        options?: Omit<DataFrameOptions<R, D>, 'columns'>
    ): DataFrame<R> {
        const columns = distributeRowsToColumns(config, records);
        return new DataFrame({
            ...options,
            columns,
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
    readonly metadata: M;

    /** cached id for lazy loading the id */
    private __id?: string;

    protected readonly _size: number;

    constructor(options: DataFrameOptions<T, M>) {
        this.name = options.name;
        this.metadata = { ...options.metadata } as M;

        this.columns = Object.isFrozen(options.columns)
            ? options.columns
            : Object.freeze(options.columns);

        const lengths = this.columns.map((col) => col.count());
        if (new Set(lengths).size > 1) {
            throw new Error(
                'All columns for a DataFrame must have the same length'
            );
        }
        this._size = lengths[0] ?? 0;
    }

    * [Symbol.iterator](): IterableIterator<T> {
        for (let i = 0; i < this._size; i++) {
            const row = this.getRow(i, false);
            if (row) yield row;
        }
    }

    /**
     * A Unique ID for the DataFrame (excludes metadata)
    */
    get id(): string {
        if (this.__id) return this.__id;
        const long = this.columns.map((col) => `${col.name}(${col.id})`).sort().join(':');
        const id = md5(long);
        this.__id = id;
        return id;
    }

    /**
     * Create a fork of the DataFrame
    */
    fork<R extends Record<string, unknown> = T>(
        columns = this.columns
    ): DataFrame<R, M> {
        return new DataFrame<R, M>({
            name: this.name,
            metadata: this.metadata,
            columns
        });
    }

    /**
     * Get the length of the DataFrame
    */
    count(): number {
        return this._size;
    }

    /**
     * Get the DataType config from the columns
    */
    get config(): DataTypeConfig {
        return columnsToDataTypeConfig(this.columns);
    }

    /**
     * Get a column by name
     * @returns a new DataFrame
    */
    select<K extends keyof T>(...fields: K[]): DataFrame<Pick<T, K>> {
        return this.fork(fields.map(
            (field): Column<any> => this.getColumn(field)!
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
     * Filter the DataFrame by fields
    */
    filterBy(filters: FilterByFields<T>): DataFrame<T> {
        const indices: number[] = [];

        for (let i = 0; i < this._size; i++) {
            const row: Partial<T> = {};
            let passed = true;
            for (const field in filters) {
                if (Object.prototype.hasOwnProperty.call(filters, field)) {
                    const col = this.getColumn(field)!;
                    const value = col.vector.get(i) as any;
                    row[field] = value;

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
     * Assign new columns to a new DataFrame
     * This will eventually handle DataFrame input
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
     * Concat rows to the end of the existing Columns
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

        const total = len + this._size;
        const builders = new Map<string, Builder>();

        for (const col of this.columns) {
            builders.set(
                col.name, Builder.makeFromVector(
                    col.vector, total
                )
            );
        }

        if (arg[0] instanceof Column) {
            const columns = (arg as Column[]);

            for (const [field, builder] of builders) {
                const col = columns.find(((c) => c.name === field));
                for (let i = 0; i < len; i++) {
                    if (col) {
                        builder.append(col.vector.get(i));
                    } else {
                        builder.append(null);
                    }
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
            const newCol = col.fork();
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
     * Create a new DataFrame with a range of rows
    */
    slice(start?: number, end?: number): DataFrame<T> {
        return this.fork(this.columns.map(
            (col) => col.fork(col.vector.slice(start, end))
        ));
    }

    /**
     * Convert the DataFrame an array of object (the output is JSON compatible)
    */
    toJSON(): T[] {
        const rows: T[] = [];
        for (let i = 0; i < this._size; i++) {
            const row = this.getRow(i, true);
            if (row) rows.push(row);
        }
        return rows;
    }
}

/**
 * DataFrame options
*/
export interface DataFrameOptions<
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    T extends Record<string, unknown> = Record<string, any>,
    M extends Record<string, unknown> = Record<string, any>
> {
    columns: Column<any>[]|readonly Column<any>[];
    name?: string;
    metadata?: M;
}

export type FilterByFields<T> = Partial<{
    [P in keyof T]: (value: Maybe<T[P]>) => boolean
}>;
