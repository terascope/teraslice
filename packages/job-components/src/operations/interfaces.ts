import { OpConfig, ExecutionConfig, Context } from '../interfaces';
import { SlicerContext, WorkerContext } from '../execution-context';
import FetcherCore from './core/fetcher-core';
import SchemaCore from './core/schema-core';
import SlicerCore from './core/slicer-core';
import APICore from './core/api-core';
import ProcessorCore from './core/processor-core';
import Slicer from './slicer';
import ParallelSlicer from './parallel-slicer';
import OperationAPI from './operation-api';

export type SlicerConstructor = {
    new<T = object>(context: SlicerContext, opConfig: OpConfig & T, executionConfig: ExecutionConfig): SlicerCore<T>;
};

export type SingleSlicerConstructor = {
    new<T = object>(context: SlicerContext, opConfig: OpConfig & T, executionConfig: ExecutionConfig): Slicer<T>;
};

export type ParallelSlicerConstructor = {
    new<T = object>(context: SlicerContext, opConfig: OpConfig & T, executionConfig: ExecutionConfig): ParallelSlicer<T>;
};

export type OperationAPIConstructor = {
    new(context: WorkerContext, executionConfig: ExecutionConfig): OperationAPI;
};

export type ObserverConstructor = {
    new(context: WorkerContext, executionConfig: ExecutionConfig): APICore;
};

export type SchemaConstructor<T = any> = {
    type(): string;
    new(context: Context): SchemaCore<T>;
};

export type APIConstructor = {
    new(context: Context, executionConfig: ExecutionConfig): APICore;
};

export type FetcherConstructor = {
    new<T = object>(context: WorkerContext, opConfig: OpConfig & T, executionConfig: ExecutionConfig): FetcherCore<T>;
};

export type ProcessorConstructor = {
    new<T = object>(context: WorkerContext, opConfig: OpConfig & T, executionConfig: ExecutionConfig): ProcessorCore<T>;
};

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
