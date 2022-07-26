import { ConnectionOptions } from 'tls';
import { ClientMetadata } from '@terascope/types';

export interface AgentOptions {
    keepAlive?: boolean;
    keepAliveMsecs?: number;
    maxSockets?: number;
    maxFreeSockets?: number;
}

export interface NodeOptions {
    url: string;
    id?: string;
    agent?: AgentOptions;
    ssl?: ConnectionOptions;
    headers?: Record<string, any>;
    roles?: {
        master: boolean;
        data: boolean;
        ingest: boolean;
    }
}

interface ClientOptions {
    node?: string | string[] | NodeOptions | NodeOptions[];
    nodes?: string | string[] | NodeOptions | NodeOptions[];
    maxRetries?: number;
    requestTimeout?: number;
    pingTimeout?: number;
    sniffInterval?: number | boolean;
    sniffOnStart?: boolean;
    sniffEndpoint?: string;
    sniffOnConnectionFault?: boolean;
    resurrectStrategy?: 'ping' | 'optimistic' | 'none';
    suggestCompression?: boolean;
    compression?: 'gzip';
    ssl?: ConnectionOptions;
    agent?: AgentOptions | false;
    headers?: Record<string, any>;
    opaqueIdPrefix?: string;
    name?: string | symbol;
    auth?: {
        username: string;
        password: string
    };
    proxy?: string | URL;
    enableMetaHeader?: boolean;
    cloud?: {
        id: string;
        // TODO: remove username and password here in 8
        username?: string;
        password?: string;
    };
    memoryCircuitBreaker?: {
        enabled: boolean;
        maxPercentage: number;
    }
}

export interface ClientConfig extends ClientOptions {
    password?: string;
    username?: string;
}

export interface ServerMetadata extends ClientMetadata {
    majorVersion: number;
    minorVersion: number;
}
