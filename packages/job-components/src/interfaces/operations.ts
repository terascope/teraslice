import { Logger } from '@terascope/core-utils';
import { Teraslice } from '@terascope/types';

export type CrossValidationFn = (
    job: Teraslice.ValidatedJobConfig, sysconfig: Teraslice.SysConfig
) => void;

export type SelfValidationFn = (config: Teraslice.OpConfig) => void;

export type ReaderFn<T> = (sliceRequest: Teraslice.SliceRequest, logger: Logger) => Promise<T> | T;

export type ProcessorFn<T> = (
    data: T,
    logger: Logger,
    sliceRequest: Teraslice.SliceRequest
) => Promise<T> | T;

/**
 * The metadata given to Slicer after successfully recovering the execution
 */
export interface SlicerRecoveryData {
    slicer_id: number;
    lastSlice?: Teraslice.SliceRequest;
}

export const sliceAnalyticsMetrics: readonly (keyof Teraslice.SliceAnalyticsData)[] = ['memory', 'size', 'time'];

export type SlicerResult
    = Teraslice.Slice | Teraslice.SliceRequest | Teraslice.SliceRequest[] | null;

export interface SliceResult {
    slice: Teraslice.Slice;
    analytics: Teraslice.SliceAnalyticsData;
    error?: string;
}

export interface SlicerFn {
    (): Promise<SlicerResult>;
}

export type SlicerFns = SlicerFn[];

export type OpAPIFn = (...args: any[]) => any;
export type OpAPIInstance = {
    [method: string]: OpAPIFn | any;
};
export type OpAPI = OpAPIFn | OpAPIInstance;

interface ExecutionWorkerStats {
    connected: number;
    available: number;
}

interface ExecutionSliceStats {
    processed: number;
    failed: number;
}

export interface ExecutionStats {
    workers: ExecutionWorkerStats;
    slices: ExecutionSliceStats;
}
