export interface BatchConfig {
    keys?: string[];
    sourceField: string;
    targetField?: string;
}

export interface ValidatedBatchConfig {
    keys: string[];
    sourceField: string;
    targetField: string;
}
