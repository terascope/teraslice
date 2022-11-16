import {
    WorkerContext, WorkerExecutionContext, SlicerExecutionContext,
    TestClientConfig, ProcessorConstructor, SlicerConstructor,
    Slice, DataEntity
} from '@terascope/job-components';

export type ExecutionContext = WorkerExecutionContext|SlicerExecutionContext;
export type Context = WorkerContext;

export interface JobHarnessOptions {
    assetDir?: string | string[];
    clients?: TestClientConfig[];
}

export interface OpTestHarnessOptions {
    clients?: TestClientConfig[];
}

export type AnyOperationConstructor = ProcessorConstructor|SlicerConstructor;

export interface SliceResults {
    slice: Slice;
    data: DataEntity[]
}

export interface AssetInfo {
    asset_string: string;
    name: string;
    account: string;
    repo: string;
    version?: string;
}
