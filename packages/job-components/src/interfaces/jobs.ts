import { Schema } from 'convict';
import { Context, Logger, SysConfig } from './context';

export interface OpConfig {
    _op: string;
}

export enum LifeCycle {
    Once = 'once',
    Persistent = 'persistent',
}

export interface JobConfig {
    analytics?: boolean;
    assets?: string[];
    lifecycle?: LifeCycle;
    max_retries?: number;
    name: string;
    operations: OpConfig[];
    probation_window?: number;
    recycle_worker?: number;
    slicers?: number;
    workers?: number;
    targets?: Targets[];
    cpu?: number;
    memory?: number;
    volumes?: Volume[];
}

export interface NativeJobConfig {
    analytics: boolean;
    assets: string[];
    lifecycle: LifeCycle;
    max_retries: number;
    name: string;
    operations: OpConfig[];
    probation_window: number;
    recycle_worker: number;
    slicers: number;
    workers: number;
}

export interface Targets {
    key: string;
    value: string;
}

export interface Volume {
    name: string;
    path: string;
}

export interface K8sJobConfig extends NativeJobConfig {
    targets: Targets[];
    cpu: number;
    memory: number;
    volumes: Volume[];
}

export type ValidatedJobConfig = NativeJobConfig|K8sJobConfig;

export interface NativeExecutionConfig extends NativeJobConfig {
    ex_id?: string;
    job_id?: string;
    slicer_hostname?: string;
    slicer_port?: number;
}

export interface K8sExecutionConfig extends K8sJobConfig {
    ex_id?: string;
    job_id?: string;
    slicer_hostname?: string;
    slicer_port?: number;
}

export type ExecutionConfig = NativeExecutionConfig|K8sExecutionConfig;

export interface ExecutionContext {
    config: ExecutionConfig;
    slicer: Function;
    queueLength: 10000|number;
    dynamicQueueLength: boolean;
    queue: Function[];
    reader: Function|null;
    reporter: null;
}

export type crossValidationFn = (job: ValidatedJobConfig, sysconfig: SysConfig) => void;
export type selfValidationFn = (config: OpConfig) => void;

export interface LegacyOperation {
    crossValidation?: crossValidationFn;
    selfValidation?: selfValidationFn;
    schema(context?: Context): Schema<any>;
}

export interface LegacyReader extends LegacyOperation {
    schema(context?: Context): Schema<any>;
    newReader(
        context: Context,
        opConfig: OpConfig,
        exectutionConfig: ExecutionConfig,
    ): Promise<readerFn<any>>;
    newSlicer(
        context: Context,
        executionContext: ExecutionContext,
        recoveryData: object[],
        logger: Logger,
    ): Promise<slicerFns>;
}

export type readerFn<T> = (sliceRequest: SliceRequest) => Promise<T>|T;
export type slicerFn = () => Promise<Slice|SliceRequest|SliceRequest[]|null>;
export type slicerFns = slicerFn[];

export interface LegacyProcessor extends LegacyOperation {
    schema(context?: Context): Schema<any>;
    newProcessor(
        context: Context,
        opConfig: OpConfig,
        executionConfig: ExecutionConfig,
    ): Promise<processorFn<any>>;
}

export type processorFn<T> = (data: T, logger: Logger, sliceRequest: SliceRequest) => Promise<T>|T;

export interface SliceRequest {
    request_worker?: string;
    [prop: string]: any;
}

export interface Slice {
    slice_id: string;
    slicer_id: number;
    slicer_order: number;
    request: SliceRequest;
    _created: string;
}

export interface SliceAnalyticsData {
    time: number[];
    size: number[];
    memory: number[];
}
