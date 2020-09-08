import { DataTypeConfig } from '@terascope/types';
import { Column } from './column';

export class DataFrame<T extends Record<string, unknown> = Record<string, any>> {
    // eslint-disable-next-line @typescript-eslint/no-shadow
    static fromJSON<T extends Record<string, unknown> = Record<string, any>>(
        data: T[], config: DataTypeConfig
    ): DataFrame<T> {
        return new DataFrame(
            Object.entries(config).map(([name, fieldConfig]) => new Column(
                name, fieldConfig, []
            )),
            config
        );
    }

    constructor(
        readonly columns: Column[],
        readonly config: DataTypeConfig
    ) {

    }

    getColumn<P extends keyof T>(name: P): Column<T[P]> {
        return this.columns.find((col) => col.name === name) as Column<T[P]>;
    }
}
