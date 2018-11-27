/**
 * OpConfig is the configuration that user specifies
 * for a Operation.
 * The only required property is `_op` since that is used
 * to find the operation.
 * Encoding defaults to "JSON" when DataEntity.fromBuffer() is called
*/
export interface OpConfig {
    _op: string;
    _encoding?: DataEncoding;
    [prop: string]: any;
}

/**
 * An enum of available encoding formats
*/
export enum DataEncoding {
    JSON = 'json',
}

/** A list of supported encoding formats */
export const dataEncodings = [DataEncoding.JSON];

export enum LifeCycle {
    Once = 'once',
    Persistent = 'persistent',
}

/**
 * JobConfig is the configuration that user specifies
 * for a Job
*/
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
    ex_id: string;
    job_id: string;
    slicer_hostname: string;
    slicer_port: number;
}

export interface K8sExecutionConfig extends K8sJobConfig {
    ex_id: string;
    job_id: string;
    slicer_hostname: string;
    slicer_port: number;
}

/**
 * ExecutionConfig a unique configuration instance for a running Job
*/
export type ExecutionConfig = NativeExecutionConfig|K8sExecutionConfig;

/**
 * LegacyExecutionContext is the old ExecutionContext available
*/
export interface LegacyExecutionContext {
    config: ExecutionConfig;
    slicer: Function;
    queueLength: 10000|number;
    dynamicQueueLength: boolean;
    queue: Function[];
    reader: Function|null;
    reporter: null;
}
