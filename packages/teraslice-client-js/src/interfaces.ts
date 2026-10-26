import { OptionsInit } from 'got';

export interface ClientConfig {
    host?: string;
    baseUrl?: string;
    apiVersion?: string;
    timeout?: number;
}

export type RequestOptions = OptionsInit;

export type PostData = string | NodeJS.ReadableStream | Buffer;
