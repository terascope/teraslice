import { DataTypeConfig } from '@terascope/types';
import { 
    FunctionContext, DynamicFunctionContext
} from '../../function-configs/interfaces.js';

export interface FunctionAdapterOptions<T extends Record<string, any>> {
    /**
     * Required with using the data field config
    */
    readonly field?: string,
    readonly args?: T | ((index: number) => T),
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

export interface FunctionAdapterContext<T extends Record<string, any>> extends FunctionContext<T> {
    preserveNulls: boolean;
    preserveEmptyObjects: boolean;
    field?: string
}

export interface DynamicFunctionAdapterContext<T extends Record<string, any>>
    extends DynamicFunctionContext<T> {
    preserveNulls: boolean;
    preserveEmptyObjects: boolean;
    field?: string
}
