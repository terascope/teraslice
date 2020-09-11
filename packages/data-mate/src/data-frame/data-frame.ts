import { DataTypeConfig } from '@terascope/types';
import { Column } from './column';
import { columnsToDataTypeConfig, distributeRowsToColumns } from './utils';

/**
 * DataFrame options
*/
export interface DataFrameOptions<
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    T extends Record<string, unknown> = Record<string, any>,
    M extends Record<string, unknown> = Record<string, any>
> {
    columns: Column[]|readonly Column[];
    name?: string;
    metadata?: M;
}
/**
 * An immutable columnar table with APIs for data pipelines.
 *
 * @todo we need conventionally metadata
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
        config: DataTypeConfig,
        records: R[] = [],
        options?: Omit<DataFrameOptions<R, D>, 'columns'>
    ): DataFrame<R> {
        const columns = distributeRowsToColumns(config, records);
        return new DataFrame({
            ...options,
            columns,
        });
    }

    name?: string;
    readonly config: Readonly<DataTypeConfig>;
    readonly columns: readonly Column[];
    /**
     * Metadata about the DataFrame
    */
    readonly metadata: M;

    private readonly _size: number;

    constructor(options: DataFrameOptions<T, M>) {
        this.name = options.name;
        this.metadata = { ...options.metadata } as M;
        this.columns = Object.freeze(options.columns);
        this.config = columnsToDataTypeConfig(options.columns);
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
     * Create a copy of the DataFrame
    */
    clone<R extends Record<string, unknown> = T>(
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
    get size(): number {
        return this._size;
    }

    /**
     * Get a column by name
     * @returns a new DataFrame
    */
    select<K extends keyof T>(...fields: K[]): DataFrame<Pick<T, K>> {
        const columns = fields.map((field) => this.getColumn(field)!.clone());
        return new DataFrame<Pick<T, K>>({
            name: this.name,
            columns: columns as Column[]
        });
    }

    /**
     * Assign new columns to a new DataFrame
     * This will eventually handle DataFrame input
    */
    assign<R extends Record<string, unknown> = Record<string, any>>(
        columns: readonly Column[]
    ): DataFrame<T & R> {
        // FIXME config, remove duplicate columns, ensure same length
        return this.clone<T & R>(
            this.columns.concat(columns) as Column<any>[],
        );
    }

    /**
     * Concat values to columns to this existing columns to a new DataFrame
     * This will eventually handle DataFrame, Vector or JSON input
    */
    concat(columns: readonly Column[]): DataFrame<T> {
        // FIXME this needs to append values not concat columns
        return this.clone(
            this.columns.concat(columns)
        );
    }

    /**
     * Rename an existing column, returns a new DataFrame
    */
    rename<R extends Record<string, unknown> = T>(
        name: string|number,
        renameTo: string,
    ): DataFrame<R> {
        const columns: Column<any>[] = this.columns.map((col, i) => {
            if (col.name === name || i === name) {
                return (col as Column<any>).transform({
                    name: renameTo,
                    config: col.config,
                    version: col.version
                });
            }
            return col.clone();
        });
        return this.clone(columns);
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
        if (index > (this.size - 1)) return;

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
                row[field] = val;
            }
        }

        return row as T;
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
