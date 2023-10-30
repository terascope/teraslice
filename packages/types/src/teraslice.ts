export interface AssetRecord {
    blob: BinaryType;
    name: string;
    version: string;
    id: string;
    description: string;
    arch: string;
    platform: string;
    node_version: number;
    _created: string|Date;
}

export interface AnalyticsRecord {
    ex_id: string;
    job_id: string;
    worker_id: string;
    slice_id: string;
    slicer_id: string;
    op: string;
    order: number;
    count: number;
    state: string;
    time: number;
    memory: number;
    '@timestamp': string|Date;
}

// TODO: make type for valid states
// TODO: fix types here
export interface ExRecord extends JobRecord {
    ex_id: string;
    _status: string;
    _has_errors: string;
    slicer_hostname: string;
    slicer_port: string;
    recovered_execution: string;
    recovered_slice_type: string;
    metadata: any;
    _slicer_stats: any;
}

export interface JobRecord {
    active: boolean;
    job_id: string;
    _context: string;
    _created: string|Date
    _updated: string|Date
}

export interface StateRecord {
    ex_id: string;
    slice_id: string;
    slicer_id: string;
    slicer_order: number;
    state: string;
    _created: string|Date;
    _updated: string|Date;
    error?: string;
}

export interface ExecutionAnalytics extends AggregatedExecutionAnalytics {
    workers_available: number,
    workers_active: number,
    subslices: number,
    slice_range_expansion: number,
    slicers: number,
    subslice_by_key: number,
    started: undefined | string | number | Date,
    queuing_complete: undefined | string | number | Date,
}

// TODO: better description here of what this is
export interface AggregatedExecutionAnalytics {
    processed: number,
    failed: number,
    queued: number,
    job_duration: number,
    workers_joined: number,
    workers_reconnected: number,
    workers_disconnected: number,
}

export interface Slice {
    slice_id: string;
    slicer_id: number;
    slicer_order: number;
    request: SliceRequest;
    _created: string;
}

export interface SliceRequest {
    request_worker?: string;
    [prop: string]: any;
}

// TODO: different?
export interface SliceAnalyticsData {
    time: number[];
    size: number[];
    memory: number[];
}
export interface EnqueuedWorker {
    workerId: string;
}

export interface SliceCompletePayload {
    slice: Slice;
    analytics: SliceAnalyticsData;
    retry?: boolean;
    error?: string;
}
