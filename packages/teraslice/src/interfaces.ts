import { Request, Response } from 'express';
import { Logger } from '@terascope/utils';

export interface TerasliceRequest extends Request {
    logger: Logger
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface TerasliceResponse extends Response {}

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
