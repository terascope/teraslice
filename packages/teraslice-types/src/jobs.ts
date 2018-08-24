import { Schema } from 'convict';
import { Context, Logger, SysConfig } from './context';

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

export interface LegacyOperation {
    crossValidation?: crossValidationFn;
    selfValidation?: selfValidationFn;
    schema(context?: Context): Schema<any>;
}

export interface LegacyReader extends LegacyOperation {
    newReader(
        context: Context,
        opConfig: OpConfig,
        jobConfig: JobConfig,
    ): (...params: any[]) => any[] | any;
}

export interface LegacySlicer extends LegacyOperation {
    schema(context?: Context): Schema<any>;
    newSlicer(
        context: Context,
        executionContext: any,
        startingPoints: any,
        logger: Logger,
    ): () => any[] | null;
}

export interface LegacyProcessor extends LegacyOperation {
    schema(context?: Context): Schema<any>;
    newProcessor(
        context: Context,
        opConfig: OpConfig,
        jobConfig: JobConfig,
    ): (...params: any[]) => any[] | any;
}
