import { Options } from 'got';

export interface ClientConfig {
    host?: string;
    baseUrl?: string;
    apiVersion?: string;
    timeout?: number;
}

// FIXME: these are redundant now
export type RequestOptions = Partial<Options>;

export type SearchOptions = Partial<Options>;

export type PostData = string | NodeJS.ReadableStream | Buffer;
