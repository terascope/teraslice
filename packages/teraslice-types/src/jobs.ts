import { Context, SysConfig } from './context';

export interface OpConfig {
    _op: string;
}

export enum LifeCycle {
    Once = 'once',
    Persistent = 'persistent',
}

export interface JobConfig {
    name: string;
    workers: number;
    slicers: number;
    max_retries: number;
    recycle_worker?: number;
    analytics: boolean;
    lifecycle: LifeCycle;
    assets: string[];
    operations: OpConfig[];
}

export interface crossValidation {
    (job: JobConfig, sysconfig: SysConfig): void;
}

export interface selfValidation {
    (config: OpConfig): void;
}

export interface processor {
    (...params: any[]): any[];
}

export interface Operation {
    schema?(context?: Context): void;
    crossValidation?: crossValidation;
    selfValidation?: selfValidation;
    newProcessor?(context: Context, opConfig: OpConfig, jobConfig: JobConfig): Promise<processor>|processor;
}

export const testJobConfig: JobConfig = {
    name: 'test-job',
    workers: 1,
    slicers: 1,
    max_retries: 1,
    recycle_worker: 0,
    analytics: false,
    lifecycle: LifeCycle.Once,
    assets: [],
    operations: [],
};
