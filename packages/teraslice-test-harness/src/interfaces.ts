import {
    WorkerExecutionContext,
    SlicerExecutionContext,
    TestClientConfig,
    ProcessorConstructor,
    SlicerConstructor,
    Slice,
    ClusterManagerType
} from '@terascope/job-components';
import { DataEntity } from '@terascope/entity-utils';

export type { Context } from '@terascope/job-components';

export type ExecutionContext = WorkerExecutionContext | SlicerExecutionContext;

export interface JobHarnessOptions {
    assetDir?: string | string[];
    clients?: TestClientConfig[];
    cluster_manager_type?: ClusterManagerType;
}

export type AnyOperationConstructor = ProcessorConstructor | SlicerConstructor;

export interface SliceResults {
    slice: Slice;
    data: DataEntity[];
}

export interface AssetInfo {
    asset_string: string;
    name: string;
    account: string;
    repo: string;
    version?: string;
}
