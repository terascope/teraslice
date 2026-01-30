/* eslint-disable @stylistic/array-element-newline */
import { isPlainObject, Logger } from '@terascope/core-utils';
import type { Terafoundation, OpenSearch } from '@terascope/types';
import { createClient as createSearchClient } from '@terascope/opensearch-client';

// list of valid keys for node:tls `ConnectionOptions` type
// This list is was compiled from the types found here, but could be different across node versions
// https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/node/v24/tls.d.ts#L607
export const sslKeys = [
    'host', 'port', 'path', 'socket', 'checkServerIdentity',
    'servername', 'session', 'minDHSize', 'lookup', 'timeout',
    'pskCallback', 'ALPNCallback', 'allowPartialTrustChain', 'ca', 'cert',
    'sigalgs', 'ciphers', 'clientCertEngine', 'crl', 'dhparam',
    'ecdhCurve', 'honorCipherOrder', 'key', 'privateKeyEngine', 'privateKeyIdentifier',
    'maxVersion', 'minVersion', 'passphrase', 'pfx', 'secureOptions',
    'secureProtocol', 'sessionIdContext', 'ticketKeys', 'sessionTimeout', 'secureContext',
    'enableTrace', 'requestCert', 'ALPNProtocols', 'SNICallback', 'rejectUnauthorized'
] as const;

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
            ssl: {
                doc: 'Set the Node.js TLS(SSL) `ConnectionOptions` for clients using this connection.',
                default: undefined,
                format(obj: any) {
                    if (obj == null) return;
                    if (!isPlainObject(obj)) {
                        throw new Error('must be object if specified');
                    }
                    const unrecognizedKeys: string[] = [];
                    for (const key of Object.keys(obj)) {
                        // TODO: it would be better to ensure all keys have valid values.
                        // We could check this object against a zod schema.
                        if (!(sslKeys as readonly string[]).includes(key)) {
                            unrecognizedKeys.push(key);
                        }
                    }
                    if (unrecognizedKeys.length > 0) {
                        throw new Error(`Unrecognized keys on "ssl" object: ${unrecognizedKeys.toString()}`);
                    }
                }
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
        if (config.ssl?.ca && config.caCertificate) {
            // only throw if using different CAs
            if (config.ssl?.ca !== config.caCertificate) {
                throw new Error(
                    'Cannot set both "caCertificate" and "ssl.ca".'
                );
            }
        }
    }
};

export default connector;
