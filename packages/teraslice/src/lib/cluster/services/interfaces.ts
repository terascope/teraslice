export interface StopExecutionOptions {
    timeout?: number | null;
    excludeNode?: string;
    force?: boolean;
}

export interface SliceTapOptions {
    size: number;
}
