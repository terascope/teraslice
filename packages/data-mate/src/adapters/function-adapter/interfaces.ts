import { DataTypeConfig } from '@terascope/types';

export interface FunctionAdapterOptions<T extends Record<string, any>> {
    /**
     * Required with using the data field config
    */
    readonly field?: string,
    readonly args?: T,
    readonly config?: DataTypeConfig;
    readonly preserveNulls?: boolean;
    readonly preserveEmptyObjects?: boolean;
}

export interface RecordFunctionAdapterOperation {
    rows<T extends Record<string, any>>(records: T[]): Record<string, unknown>[];
}

export interface FieldFunctionAdapterOperation extends RecordFunctionAdapterOperation {
    column(values: unknown[]): unknown[];
}
