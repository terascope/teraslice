import { DataTypeConfig } from '@terascope/types';
import { fastCloneDeep } from '@terascope/utils';
import { Column } from './column';
import { distributeRowsToColumns } from './utils';

/**
 * An immutable columnar table with APIs for data pipelines
*/
export class DataFrame<T extends Record<string, unknown> = Record<string, any>> {
    /**
     * Create a DataFrame from an array of JSON objects
    */
    static fromJSON<R extends Record<string, unknown> = Record<string, any>>(
        config: DataTypeConfig, records: R[]
    ): DataFrame<R> {
        return new DataFrame(
            config,
            distributeRowsToColumns(config, records),
        );
    }

    readonly config: DataTypeConfig;
    readonly columns: Column[];

    constructor(
        config: DataTypeConfig,
        columns: Column[],
    ) {
        this.config = fastCloneDeep(config);
        this.columns = columns.slice();
    }

    * [Symbol.iterator](): IterableIterator<T> {
        for (let i = 0; i < this.length; i++) {
            const row = this.getRow(i, false);
            if (row) yield row;
        }
    }

    /**
     * Get the length of the DataFrame
    */
    get length(): number {
        if (this.columns[0] == null) return 0;
        return this.columns[0].length;
    }

    /**
     * Get a column by name
     * @returns a new DataFrame
    */
    select<K extends keyof T>(fields: K[]): DataFrame<Pick<T, K>>|undefined {
        const columns = fields.map((field) => this.getColumn(field)!);
        return new DataFrame<Pick<T, K>>(
            this.config, columns as Column[]
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
            this.config,
            this.columns.concat(columns) as Column<any>[],
        );
    }

    /**
     * Concat values to columns to this existing columns to a new DataFrame
     * This will eventually handle DataFrame, Vector or JSON input
    */
    concat(
        columns: Column[]
    ): DataFrame<T> {
        // FIXME this needs to append values not concat columns
        return new DataFrame<T>(
            this.config,
            this.columns.concat(columns)
        );
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
     * Get a row by index
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
        for (let i = 0; i < this.length; i++) {
            const row = this.getRow(i, true);
            if (row) rows.push(row);
        }
        return rows;
    }
}
