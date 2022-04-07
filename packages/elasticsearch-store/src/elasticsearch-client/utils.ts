import { hasOwn, isString, isEmpty } from '@terascope/utils';
import { HTTPSOptions } from 'got';
import * as open from '@opensearch-project/opensearch';
import { ConnectionOptions } from 'tls';

interface AgentOptions {
    keepAlive?: boolean;
    keepAliveMsecs?: number;
    maxSockets?: number;
    maxFreeSockets?: number;
}

interface NodeOptions {
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

export interface ClientConfig extends open.ClientOptions {
    password?: string;
    username?: string;
}

function isNodeOptions(input: any): input is NodeOptions {
    if (input) {
        if (input?.url) {
            return true;
        }
    }
    return false;
}

export function getUrl(config: ClientConfig): string {
    if (config.node && isString(config.node)) {
        return config.node;
    }

    if (isNodeOptions(config.node)) {
        return config.node.url;
    }

    if (Array.isArray(config.node)) {
        const firstNode = config.node[0];
        if (isNodeOptions(firstNode)) {
            return firstNode.url;
        }
    }

    if (Array.isArray(config.nodes)) {
        const firstNode = config.nodes[0];
        if (isNodeOptions(firstNode)) {
            return firstNode.url;
        }
    }

    throw new Error('Could not find url in config');
}

interface AuthOptions {
    password?: string;
    username?: string;
    https?: HTTPSOptions;
}

export function getAuth(config: ClientConfig): AuthOptions {
    let password: string | undefined;
    let username: string | undefined;
    const https: HTTPSOptions = {};

    if (hasOwn(config, 'password')) {
        password = config.password;
    }

    if (hasOwn(config, 'username')) {
        username = config.username;
    }

    if (config.auth) {
        password = config.auth.password;
        username = config.auth.username;
    }

    if (config.cloud) {
        // TODO: might need id of cloud here??
        password = config.cloud.password;
        username = config.cloud.username;
    }

    if (config.ssl) {
        if (hasOwn(config, 'ssl.rejectUnauthorized')) {
            https.rejectUnauthorized = config.ssl.rejectUnauthorized;
        }

        if (config.ssl.cert) {
            https.certificate = config.ssl.cert;
        }

        if (config.ssl.key) {
            https.key = config.ssl.key;
        }
    }

    if (isNodeOptions(config.node) && config.node.ssl) {
        if (hasOwn(config, 'node.ssl.rejectUnauthorized')) {
            https.rejectUnauthorized = config.node.ssl.rejectUnauthorized;
        }

        if (config.node.ssl.cert) {
            https.certificate = config.node.ssl.cert;
        }

        if (config.node.ssl.key) {
            https.key = config.node.ssl.key;
        }
    }

    if (Array.isArray(config.node)) {
        const firstNode = config.node[0];
        if (isNodeOptions(firstNode) && firstNode.ssl) {
            if (hasOwn(config, 'node.ssl.rejectUnauthorized')) {
                https.rejectUnauthorized = firstNode.ssl.rejectUnauthorized;
            }

            if (firstNode.ssl.cert) {
                https.certificate = firstNode.ssl.cert;
            }

            if (firstNode.ssl.key) {
                https.key = firstNode.ssl.key;
            }
        }
    }

    if (config.nodes) {
        const firstNode = config.nodes[0];
        if (isNodeOptions(firstNode) && firstNode.ssl) {
            if (hasOwn(config, 'node.ssl.rejectUnauthorized')) {
                https.rejectUnauthorized = firstNode.ssl.rejectUnauthorized;
            }

            if (firstNode.ssl.cert) {
                https.certificate = firstNode.ssl.cert;
            }

            if (firstNode.ssl.key) {
                https.key = firstNode.ssl.key;
            }
        }
    }

    if ((password && username == null) || (password == null && username)) {
        throw new Error('Parameters username and password must be specified together');
    }

    return {
        ...(password && { password }),
        ...(username && { username }),
        ...(!isEmpty(https) && { https })
    };
}

export function getHeaders(config: ClientConfig): Record<string, any> {
    let headers: Record<string, any> = {};

    if (config.headers) {
        headers = {
            ...config.headers
        };
    }

    if (isNodeOptions(config.node) && config.node.headers) {
        headers = {
            ...config.node.headers
        };
    }

    if (Array.isArray(config.node)) {
        const firstNode = config.node[0];
        if (isNodeOptions(firstNode) && firstNode.headers) {
            headers = {
                ...firstNode.headers
            };
        }
    }

    if (Array.isArray(config.nodes)) {
        const firstNode = config.nodes[0];
        if (isNodeOptions(firstNode) && firstNode.headers) {
            headers = {
                ...firstNode.headers
            };
        }
    }

    return headers;
}
