import * as bunyan from 'bunyan';
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

export type crossValidation = (job: JobConfig, sysconfig: SysConfig) => void;

export type selfValidation = (config: OpConfig) => void;

export type processor = (...params: any[]) => any[]|any;

export type slicer = () => any[]|null

export type slicers = (...params: any[]) => slicer[];

export interface Operation {
    crossValidation?: crossValidation;
    selfValidation?: selfValidation;
    schema?(context?: Context): void;
    newProcessor?(context: Context, opConfig: OpConfig, jobConfig: JobConfig): Promise<processor>|processor;
    newReader?(context: Context, opConfig: OpConfig, jobConfig: JobConfig): Promise<processor>|processor;
    newSlicer?(context: Context, executionContext: any, startingPoints: any, logger: bunyan): Promise<slicer>|slicer;
}

export const TestJobConfig: JobConfig = {
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
