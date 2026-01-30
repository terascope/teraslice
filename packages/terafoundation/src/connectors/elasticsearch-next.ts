import { isPlainObject, Logger } from '@terascope/core-utils';
import type { Terafoundation, OpenSearch } from '@terascope/types';
import { createClient as createSearchClient } from '@terascope/opensearch-client';

const connector: Terafoundation.Connector = {
    async createClient(customConfig: Record<string, any>, logger: Logger) {
        const { client, log } = await createSearchClient(customConfig, logger);
        return { client, logger: log() };
    },
    config_schema(): Record<string, any> {
        return {
            node: {
                doc: 'A list of hosts to connect to',
                default: ['http://127.0.0.1:9200'],
                format(val: any) {
                    if (!(Array.isArray(val) || typeof val === 'string')) {
                        throw new Error('must be a string or array');
                    }
                }
            },
            sniffOnStart: {
                doc: 'Sniff hosts on start up',
                default: false
            },
            caCertificate: {
                doc: 'A string containing a single or multiple ca certificates',
                default: undefined,
                format: String
            },
            username: {
                doc: 'Username for authenticating with cluster. Required if authentication is enabled.',
                default: undefined,
                format: String
            },
            password: {
                doc: 'Password for authenticating with cluster. Must be used in conjunction with the username.',
                default: undefined,
                format: String
            },
            sniffOnConnectionFault: {
                doc: 'Sniff hosts on connection failure',
                default: false
            },
            requestTimeout: {
                doc: 'Request timeout',
                default: 120000,
                format: 'duration'
            },
            maxRetries: {
                doc: 'Maximum retries for a failed request',
                default: 3
            },
            suggestCompression: {
                doc: 'Adds `accept-encoding: \'gzip,deflate\'` header to every request, enabling HTTP compression for responses.',
                default: false,
                format: Boolean
            },
            pingTimeout: {
                doc: 'Max ping request timeout in milliseconds for each request. If undefined will use the client\'s default, usually `3000`',
                default: undefined,
                format: Number
            },
            sniffInterval: {
                doc: 'Perform a sniff operation every n milliseconds. If undefined will use the client\'s default, usually `false`',
                default: undefined,
                format(val: any) {
                    if (!(typeof val === 'number' || val === false || val === undefined)) {
                        throw new Error('must be a number or false');
                    }
                }
            },
            sniffEndpoint: {
                doc: 'Endpoint to ping during a sniff. If undefined will use the client\'s default, usually `_nodes/_all/http`.',
                default: undefined,
                format: String
            },
            auth: {
                doc: 'Your authentication data. Does not support "ApiKey" or "Bearer" token authentication.',
                default: undefined,
                format(obj: any) {
                    if (obj == null) return;
                    if (!isPlainObject(obj)) {
                        throw new Error('must be object if specified');
                    }
                    if (typeof obj.username !== 'string') {
                        throw new Error('username must be a string.');
                    }
                    if (typeof obj.password !== 'string') {
                        throw new Error('password must be a string.');
                    }
                }
            },
        };
    },
    validate_config<S>(
        config: OpenSearch.ClientConfig,
        _sysconfig: Terafoundation.SysConfig<S>
    ): void {
        if (config.auth && (config.username || config.password)) {
            throw new Error('"auth" can not be set at the same time as "username" or "password".');
        }
        if (config.username || config.password) {
            if (!config.username || !config.password) {
                throw new Error(
                    'Both "username" and "password" must be provided when one is set'
                );
            }
        }
    }
};

export default connector;
