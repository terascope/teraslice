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
    maxRetries: number;
    analytics: boolean;
    lifecycle: LifeCycle;
    assets: string[];
    operations: OpConfig[];
}
