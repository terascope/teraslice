import { Schema } from 'convict';
import { Logger } from '@terascope/utils';
import {
    ValidatedJobConfig, OpConfig, ExecutionConfig, LegacyExecutionContext
} from './jobs';
import { Context, SysConfig } from './context.js';

export type CrossValidationFn = (job: ValidatedJobConfig, sysconfig: SysConfig) => void;
export type SelfValidationFn = (config: OpConfig) => void;
export type SliceQueueLengthFn = (executionContext: LegacyExecutionContext) => number | string;

export interface LegacyOperation {
    crossValidation?: CrossValidationFn;
    selfValidation?: SelfValidationFn;
    schema(context?: Context): Schema<any>;
}

export interface LegacyReader extends LegacyOperation {
    slicerQueueLength?: SliceQueueLengthFn;
    schema(context?: Context): Schema<any>;
    newReader(
        context: Context,
        opConfig: OpConfig,
        exectutionConfig: ExecutionConfig
    ): Promise<ReaderFn<any>>;
    newSlicer(
        context: Context,
        executionContext: LegacyExecutionContext,
        recoveryData: SlicerRecoveryData[],
        logger: Logger
    ): Promise<SlicerFns>;
}

export type ReaderFn<T> = (sliceRequest: SliceRequest, logger: Logger) => Promise<T> | T;

export interface LegacyProcessor extends LegacyOperation {
    schema(context?: Context): Schema<any>;
    newProcessor(
        context: Context,
        opConfig: OpConfig,
        executionConfig: ExecutionConfig
    ): Promise<ProcessorFn<any>>;
}

export type ProcessorFn<T> = (
    data: T,
    logger: Logger,
    sliceRequest: SliceRequest
) => Promise<T> | T;

/**
 * The metadata created by the Slicer and ran through a job pipeline
 *
 * See [[Slice]]
 */
export interface SliceRequest {
    /** A reserved key for sending work to a particular worker */
    request_worker?: string;
    /** The slice request can contain any metdata */
    [prop: string]: any;
}

/**
 * The metadata given to Slicer after succefully recovering the execution
 */
export interface SlicerRecoveryData {
    slicer_id: number;
    lastSlice?: SliceRequest;
}

/**
 * A trackable set of work to be preformed by a "Worker"
 */
export interface Slice {
    /**
     * A unique identifier for the slice
     */
    slice_id: string;
    /**
     * A reference to the slicer that created the slice.
     */
    slicer_id: number;
    /**
     * A reference to the slicer
     */
    slicer_order: number;
    request: SliceRequest;
    _created: string;
}

export interface SliceAnalyticsData {
    time: number[];
    size: number[];
    memory: number[];
}

export const sliceAnalyticsMetrics: readonly (keyof SliceAnalyticsData)[] = ['memory', 'size', 'time'];

export type SlicerResult = Slice | SliceRequest | SliceRequest[] | null;

export interface SliceResult {
    slice: Slice;
    analytics: SliceAnalyticsData;
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
