import { DataTypeConfig } from '@terascope/types';
import { Column } from './column';
import { distributeRowsToColumns } from './utils';

export class DataFrame<T extends Record<string, unknown> = Record<string, any>> {
    // eslint-disable-next-line @typescript-eslint/no-shadow
    static fromJSON<T extends Record<string, unknown> = Record<string, any>>(
        config: DataTypeConfig, records: T[]
    ): DataFrame<T> {
        return new DataFrame(
            config,
            distributeRowsToColumns(config, records),
        );
    }

    constructor(
        readonly config: DataTypeConfig,
        readonly columns: Column[],
    ) {}

    get length(): number {
        if (this.columns[0] == null) return 0;
        return this.columns[0].length;
    }

    getColumn<P extends keyof T>(name: P): Column<T[P]>|undefined {
        const found = this.columns.find((col) => col.name === name);
        return found as Column<any>|undefined;
    }

    toJSON(): T[] {
        const len = this.length;
        const results: T[] = [];

        for (let i = 0; i < len; i++) {
            const row: Partial<T> = {};
            let numValues = 0;

            for (const col of this.columns) {
                const field = col.name as keyof T;
                const rawValue = col.vector.get(i);
                let val: any;
                if (col.vector.valueToJSON) {
                    val = col.vector.valueToJSON(rawValue);
                } else {
                    val = rawValue;
                }

                if (val != null) {
                    numValues++;
                    row[field] = val;
                }
            }

            if (numValues) {
                results.push(row as T);
            }
        }

        return results;
    }
}
