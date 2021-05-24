import { DataTypeConfig } from '@terascope/types';
import { DataTypeFieldAndChildren } from '../../function-configs/interfaces';

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
    rows: (records: Record<string, unknown>[]) => Record<string, unknown>[];
}

export interface FieldFunctionAdapterOperation extends RecordFunctionAdapterOperation {
    column(values: unknown[]): unknown[];
}

export interface PartialArgs
<T extends Record<string, any> = Record<string, unknown>> {
    args: T,
    readonly inputConfig?: DataTypeFieldAndChildren
}
