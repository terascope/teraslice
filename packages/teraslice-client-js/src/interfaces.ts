import { Options } from 'got';

export interface ClientConfig {
    host?: string;
    baseUrl?: string;
    apiVersion?: string;
    timeout?: number;
}

export type RequestOptions = Partial<Options>;

export type PostData = string | NodeJS.ReadableStream | Buffer;
