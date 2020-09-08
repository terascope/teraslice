import { DataTypeFieldConfig, Maybe } from '@terascope/types';

export class Column<T = unknown> {
    constructor(
        readonly name: string,
        readonly config: DataTypeFieldConfig,
        readonly values: Maybe<T>[]
    ) {}

    get length(): number {
        return this.values.length;
    }
}
