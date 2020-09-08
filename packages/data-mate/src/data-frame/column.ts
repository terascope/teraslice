import { DataTypeFieldConfig } from '@terascope/types';

export class Column<T = unknown> {
    readonly distinct: T[];
    readonly indices: number[];

    constructor(readonly name: string, readonly config: DataTypeFieldConfig, _values: T[]) {
        this.distinct = [];
        this.indices = [];
    }
}
