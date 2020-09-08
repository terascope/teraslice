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
        return this.columns.find(
            (col) => col.name === name
        ) as Column<T[P]>|undefined;
    }
}
