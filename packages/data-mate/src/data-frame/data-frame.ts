import { DataTypeConfig, Maybe } from '@terascope/types';
import { Column, ColumnOptions } from './column';
import { distributeRowsToColumns } from './utils';

/**
 * An immutable columnar table with APIs for data pipelines.
 *
 * @todo add name to the data frame
 * @todo remove the empty record logic
 * @todo we need to copy the metadata when forking
 * @todo we need conventionally metadata
*/
export class DataFrame<
    T extends Record<string, unknown> = Record<string, any>,
    M extends Record<string, unknown> = Record<string, any>
> {
    /**
     * Create a DataFrame from an array of JSON objects
    */
    static fromJSON<R extends Record<string, unknown> = Record<string, any>>(
        config: DataTypeConfig, records: R[]
    ): DataFrame<R> {
        return new DataFrame(
            distributeRowsToColumns(config, records),
        );
    }

    readonly columns: Column[];
    /**
     * Metadata about the DataFrame
    */
    readonly metadata?: Record<string, any>;

    private readonly _size: number;

    constructor(columns: Column[], metadata?: M) {
        this.metadata = metadata;
        this.columns = columns.slice();
        const lengths = this.columns.map((col) => col.size);
        if (new Set(lengths).size > 1) {
            throw new Error(
                'All columns for a data frame must have the same length'
            );
        }
        this._size = lengths[0] ?? 0;
    }

    * [Symbol.iterator](): IterableIterator<T> {
        for (let i = 0; i < this.size; i++) {
            const row = this.getRow(i, false);
            if (row) yield row;
        }
    }

    /**
     * Get the length of the DataFrame
    */
    get size(): number {
        return this._size;
    }

    /**
     * Get a column by name
     * @returns a new DataFrame
    */
    select<K extends keyof T>(...fields: K[]): DataFrame<Pick<T, K>> {
        const columns = fields.map((field) => this.getColumn(field)!.clone());
        return new DataFrame<Pick<T, K>>(
            columns as Column[]
        );
    }

    /**
     * Assign new columns to a new DataFrame
     * This will eventually handle DataFrame input
    */
    assign<R extends Record<string, unknown> = Record<string, any>>(
        columns: Column[]
    ): DataFrame<T & R> {
        // FIXME config, remove duplicate columns, ensure same length
        return new DataFrame<T & R>(
            this.columns.concat(columns) as Column<any>[],
        );
    }

    /**
     * Concat values to columns to this existing columns to a new DataFrame
     * This will eventually handle DataFrame, Vector or JSON input
    */
    concat(columns: Column[]): DataFrame<T> {
        // FIXME this needs to append values not concat columns
        return new DataFrame<T>(
            this.columns.concat(columns)
        );
    }

    /**
     * Creates a new column, you can optionally transform the values
     * but shouldn't change the length.
     *
     * This can be used to change the name, type of column.
     * Useful for replacing a column in a DataFrame.
     *
     * @returns the new column so it works like fluent API
    */
    rename<R extends Record<string, unknown> = T, V = any>(
        name: string|number,
        columnOptions: ColumnOptions<V>,
        fn?: (value: Maybe<V>, index: number) => Maybe<V>
    ): DataFrame<R> {
        const columns: Column<any>[] = this.columns.map((col, i) => {
            if (col.name === name || i === name) {
                return (col as Column<any>).transform(columnOptions, fn);
            }
            return col.clone();
        });
        return new DataFrame(columns, this.metadata);
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
    getRow(index: number, returnJSON = false): T|undefined {
        const row: Partial<T> = {};
        let numValues = 0;

        for (const col of this.columns) {
            const field = col.name as keyof T;
            const rawValue = col.vector.get(index);
            let val: any;
            if (returnJSON && col.vector.valueToJSON) {
                val = col.vector.valueToJSON(rawValue);
            } else {
                val = rawValue;
            }

            if (val != null) {
                numValues++;
                row[field] = val;
            }
        }

        return numValues ? row as T : undefined;
    }

    /**
     * Convert the DataFrame an array of object (the output is JSON compatible)
    */
    toJSON(): T[] {
        const rows: T[] = [];
        for (let i = 0; i < this.size; i++) {
            const row = this.getRow(i, true);
            if (row) rows.push(row);
        }
        return rows;
    }
}
