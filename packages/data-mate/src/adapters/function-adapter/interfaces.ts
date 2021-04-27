import { DataTypeFieldConfig } from '@terascope/types';

export interface FunctionAdapterOptions<T extends Record<string, any>> {
    field?: string,
    args?: T,
    inputConfig?: DataTypeFieldConfig
    preserveNulls?: boolean;
    preserveEmptyObjects?: boolean;
}

export interface RecordFunctionAdapterOperation {
    rows<T extends Record<string, any>>(records: T[]): Record<string, unknown>[];
}

export interface FieldFunctionAdapterOperation extends RecordFunctionAdapterOperation {
    column(values: unknown[]): unknown[];
}
