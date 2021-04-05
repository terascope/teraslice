import { ColumnJSON } from '../column';

export interface DataFrameJSON {
    readonly name?: string;
    readonly size: number;
    readonly metadata: Record<string, unknown>;
    readonly columns: ColumnJSON[];
}
