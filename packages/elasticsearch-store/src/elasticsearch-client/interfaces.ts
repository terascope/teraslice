import type { ClientOptions } from '@opensearch-project/opensearch';
import { ConnectionOptions } from 'tls';

export interface MetadataResponse {
    name: string;
    cluster_name: string;
    cluster_uuid: string;
    version: {
        distribution: string;
        number: string;
        build_type: string;
        build_hash: string;
        build_date: string;
        build_snapshot: boolean,
        lucene_version: string;
        minimum_wire_compatibility_version: string;
        minimum_index_compatibility_version: string;
    },
    tagline: string;
}

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

export interface ClientConfig extends ClientOptions {
    password?: string;
    username?: string;
}
