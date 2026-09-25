export interface StopExecutionOptions {
    timeout?: number | null;
    excludeNode?: string;
    force?: boolean;
}

export interface SliceTraceOptions {
    size: number;
}
