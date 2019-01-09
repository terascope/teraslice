import { DataEncoding } from '@terascope/utils';

/**
 * OpConfig is the configuration that user specifies
 * for a Operation.
 * The only required property is `_op` since that is used
 * to find the operation.
*/
export interface OpConfig {
    /** The name of the operation */
    _op: string;

    /** Used for specifying the data encoding type when using `DataEntity.fromBuffer`. Defaults to `json`. */
    _encoding?: DataEncoding;
    /**
     * This action will specify what to do when failing to parse or transform a record. ​​​​​
​​​​​     * The following builtin actions are supported: ​​​
​​​​​     *  - "throw": throw the original error ​​​​​
​​​​​     *  - "log": log the error and the data ​​​​​
​​​​​     *  - "none": (default) skip the error entirely
     *
​​     * If none of the actions are specified it will try and use a registered Dead Letter Queue API under that name.
     * The API must be already be created by a operation before it can used.​
    */
    _dead_letter_action?: DeadLetterAction;
    [prop: string]: any;
}

/**
 * available dead letter queue actions
*/
export type DeadLetterAction = 'throw'|'log'|'none'|string;

/** A supported DeadLetterAPIFn */
export type DeadLetterAPIFn = (input: any, err: Error) => void;

/**
 * APIConfig is the configuration for loading APIs and Observers
 * into a ExecutionContext.
*/
export interface APIConfig {
    /**
     * The name of the api, this must be unique among any loaded APIs
     * but can be namespaced by using the format "example:0"
     */
    _name: string;
    [prop: string]: any;
}

export type LifeCycle = 'once'|'persistent';

/**
 * JobConfig is the configuration that user specifies
 * for a Job
*/
export type JobConfig = Partial<ValidatedJobConfig>;

export interface ValidatedJobConfig {
    analytics: boolean;
    assets: string[];
    assetIds?: string[];
    lifecycle: LifeCycle;
    max_retries: number;
    name: string;
    apis: APIConfig[];
    operations: OpConfig[];
    probation_window: number;
    recycle_worker: number;
    slicers: number;
    workers: number;
    /** This will only be available in the context of k8s */
    targets?: Targets[];
    /** This will only be available in the context of k8s */
    cpu?: number;
    /** This will only be available in the context of k8s */
    memory?: number;
    /** This will only be available in the context of k8s */
    volumes?: Volume[];
}

export interface Targets {
    key: string;
    value: string;
}

export interface Volume {
    name: string;
    path: string;
}

export interface ExecutionConfig extends ValidatedJobConfig {
    ex_id: string;
    job_id: string;
    slicer_hostname: string;
    slicer_port: number;
}

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
