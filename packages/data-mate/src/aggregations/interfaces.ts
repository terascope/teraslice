export interface BatchConfig {
    keys?: string[];
    source: string;
    target?: string;
}

export interface ValidatedBatchConfig {
    keys: string[];
    source: string;
    target: string;
}
