import { Omit } from '@terascope/utils';
import * as got from 'got';

export interface ClientConfig {
    host?: string;
    baseUrl?: string;
    apiVersion?: string;
    timeout?: number;
}

export type RequestOptions = got.Options;

export type SearchOptions = Omit<got.Options, 'searchParams'>;

export type PostData = string | NodeJS.ReadableStream | Buffer;
