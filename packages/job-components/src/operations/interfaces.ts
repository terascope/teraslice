import {
    ExecutionConfig, Context, OpConfig,
    APIConfig, WorkerContext
} from '../interfaces/index.js';
import FetcherCore from './core/fetcher-core.js';
import SchemaCore, { OpType } from './core/schema-core.js';
import SlicerCore from './core/slicer-core.js';
import APICore from './core/api-core.js';
import ProcessorCore from './core/processor-core.js';
import Slicer from './slicer.js';
import ParallelSlicer from './parallel-slicer.js';
import OperationAPI from './operation-api.js';

export type APICoreConstructor<U> = {
    new (context: WorkerContext, apiConfig: APIConfig, executionConfig: ExecutionConfig): U;
};

export type OperationCoreConstructor<U> = {
    new <T = OpConfig>(
        context: WorkerContext,
        opConfig: OpConfig & T,
        executionConfig: ExecutionConfig
    ): U;
};

export type SlicerCoreConstructor<U> = {
    new <T = OpConfig>(
        context: WorkerContext,
        opConfig: OpConfig & T,
        executionConfig: ExecutionConfig
    ): U;
};

export type SchemaConstructor<T = any> = {
    type(): string;
    new (context: Context, opType?: OpType): SchemaCore<T>;
};

export type OperationAPIConstructor = APICoreConstructor<OperationAPI>;
export type ObserverConstructor = APICoreConstructor<APICore>;
export type APIConstructor = APICoreConstructor<APICore>;
export type SlicerConstructor = SlicerCoreConstructor<SlicerCore>;
export type SingleSlicerConstructor = SlicerCoreConstructor<Slicer>;
export type ParallelSlicerConstructor = SlicerCoreConstructor<ParallelSlicer>;
export type FetcherConstructor = OperationCoreConstructor<FetcherCore>;
export type ProcessorConstructor = OperationCoreConstructor<ProcessorCore>;

export type CoreOperation = FetcherCore | SlicerCore | ProcessorCore;

export interface OperationModule {
    Schema: SchemaConstructor;
    API?: OperationAPIConstructor;
}

export interface SchemaModule {
    Schema: SchemaConstructor;
}

export type OperationAPIType = 'api' | 'observer';
export interface APIModule extends SchemaModule {
    API: OperationAPIConstructor | ObserverConstructor;
    type: OperationAPIType;
}

export interface ReaderModule extends OperationModule {
    Slicer: SlicerConstructor;
    Fetcher: FetcherConstructor;
}

export interface ProcessorModule extends OperationModule {
    Processor: ProcessorConstructor;
}
