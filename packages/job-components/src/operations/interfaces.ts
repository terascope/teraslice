import { ExecutionConfig, Context, OpConfig, WorkerContext } from '../interfaces';
import FetcherCore from './core/fetcher-core';
import SchemaCore from './core/schema-core';
import SlicerCore from './core/slicer-core';
import APICore from './core/api-core';
import ProcessorCore from './core/processor-core';
import Slicer from './slicer';
import ParallelSlicer from './parallel-slicer';
import OperationAPI from './operation-api';

export type APICoreConstructor<U> = {
    new(context: WorkerContext, executionConfig: ExecutionConfig): U;
};

export type OperationCoreConstructor<U> = {
    new<T = OpConfig>(context: WorkerContext, opConfig: OpConfig & T, executionConfig: ExecutionConfig): U;
};

export type SlicerCoreConstructor<U> = {
    new<T = OpConfig>(context: WorkerContext, opConfig: OpConfig & T, executionConfig: ExecutionConfig): U;
};

export type SchemaConstructor<T = any> = {
    type(): string;
    new(context: Context): SchemaCore<T>;
};

export type OperationAPIConstructor = APICoreConstructor<OperationAPI>;
export type ObserverConstructor = APICoreConstructor<APICore>;
export type APIConstructor = APICoreConstructor<APICore>;
export type SlicerConstructor = SlicerCoreConstructor<SlicerCore>;
export type SingleSlicerConstructor = SlicerCoreConstructor<Slicer>;
export type ParallelSlicerConstructor = SlicerCoreConstructor<ParallelSlicer>;
export type FetcherConstructor = OperationCoreConstructor<FetcherCore>;
export type ProcessorConstructor = OperationCoreConstructor<ProcessorCore>;

export type CoreOperation = FetcherCore|SlicerCore|ProcessorCore;

export interface OperationModule {
    Schema: SchemaConstructor;
    API?: OperationAPIConstructor;
}

export interface SchemaModule {
    Schema: SchemaConstructor;
}

export interface APIModule {
    API: OperationAPIConstructor;
}

export interface ObserverModule {
    Observer: ObserverConstructor;
}

export interface ReaderModule extends OperationModule {
    Slicer: SlicerConstructor;
    Fetcher: FetcherConstructor;
}

export interface ProcessorModule extends OperationModule {
    Processor: ProcessorConstructor;
}
