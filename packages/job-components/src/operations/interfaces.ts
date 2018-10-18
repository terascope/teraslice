import { OpConfig, ExecutionConfig, Context } from '../interfaces';
import { SlicerContext, WorkerContext } from '../execution-context';
import ObserverCore from './core/observer-core';
import FetcherCore from './core/fetcher-core';
import SchemaCore from './core/schema-core';
import SlicerCore from './core/slicer-core';
import APICore from './core/api-core';
import ProcessorCore from './core/processor-core';
import Slicer from './slicer';
import ParallelSlicer from './parallel-slicer';
import OperationAPI from './operation-api';

export type SlicerConstructor = {
    new(context: SlicerContext, opConfig: OpConfig, executionConfig: ExecutionConfig): SlicerCore;
};

export type SingleSlicerConstructor = {
    new(context: SlicerContext, opConfig: OpConfig, executionConfig: ExecutionConfig): Slicer;
};

export type ParallelSlicerConstructor = {
    new(context: SlicerContext, opConfig: OpConfig, executionConfig: ExecutionConfig): ParallelSlicer;
};

export type OperationAPIConstructor = {
    new(context: WorkerContext, executionConfig: ExecutionConfig): OperationAPI;
};

export type ObserverConstructor = {
    new(context: WorkerContext, executionConfig: ExecutionConfig): ObserverCore;
};

export type SchemaConstructor = {
    type(): string;
    new(context: Context): SchemaCore;
};

export type APIConstructor = {
    new(context: Context, executionConfig: ExecutionConfig): APICore;
};

export type FetcherConstructor = {
    new(context: WorkerContext, opConfig: OpConfig, executionConfig: ExecutionConfig): FetcherCore;
};

export type ProcessorConstructor = {
    new(context: WorkerContext, opConfig: OpConfig, executionConfig: ExecutionConfig): ProcessorCore;
};

export interface OperationModule {
    Schema: SchemaConstructor;
    API?: OperationAPIConstructor;
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
