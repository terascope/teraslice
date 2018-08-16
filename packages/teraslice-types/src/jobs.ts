import bunyan from 'bunyan';
import { Schema } from 'convict';
import { Context, SysConfig } from './context';

export interface OpConfig {
    _op: string;
}

export enum LifeCycle {
    Once = 'once',
    Persistent = 'persistent',
}

export interface JobConfig {
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

export type crossValidationFn = (job: JobConfig, sysconfig: SysConfig) => void;

export type selfValidationFn = (config: OpConfig) => void;

export type processorFn = (...params: any[]) => any[]|any;

export type slicerFn = () => any[]|null

export type slicersFn = (...params: any[]) => slicerFn[];

export interface Operation {
    crossValidation?: crossValidationFn;
    selfValidation?: selfValidationFn;
    schema(context?: Context): Schema<any>;
    newProcessor?(context: Context, opConfig: OpConfig, jobConfig: JobConfig): Promise<processorFn>|processorFn;
    newReader?(context: Context, opConfig: OpConfig, jobConfig: JobConfig): Promise<processorFn>|processorFn;
    newSlicer?(context: Context, executionContext: any, startingPoints: any, logger: bunyan): Promise<slicersFn>|slicersFn;
}

export function newTestJobConfig(): JobConfig {
    return {
        analytics: false,
        assets: [],
        lifecycle: LifeCycle.Once,
        max_retries: 1,
        name: 'test-job',
        operations: [],
        probation_window: 30000,
        recycle_worker: 0,
        slicers: 1,
        workers: 1,
    };
}
