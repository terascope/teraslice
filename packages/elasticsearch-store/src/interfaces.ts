export type AsyncFn<T> = () => Promise<T>;

export type BulkAction = 'index' | 'create' | 'delete' | 'update';

export interface BulkResponseItem {
    error?: {
        type: string;
        reason: string;
    };
    status?: number;
    /**
     * This only exists in 6.x
     */
    _seq_no?: number;
}

export type BulkResponseItems = { [key in BulkAction]?: BulkResponseItem };

export interface BulkResponse {
    errors: boolean;
    took: number;
    items: BulkResponseItems[];
}

export type Shard = { primary: boolean; stage: string };
