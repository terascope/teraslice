export interface OperationConfig {
    _op: string;
}

export interface Operations {
    [index: number]: OperationConfig;
}

export interface Assets {
    [index: number]: String;
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
    assets: Assets;
    operations: Operations;
}
