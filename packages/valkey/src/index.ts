import { GlideClient, GlideClientConfiguration } from '@valkey/valkey-glide';
import { debugLogger, isKey, Logger } from '@terascope/core-utils';
import { Terafoundation } from '@terascope/types';

class ValkeyConnector {
    async createClient(
        config: GlideClientConfiguration,
        logger = debugLogger('valkey-client')
    ): Promise<{ client: GlideClient; logger: Logger }> {
        return {
            client: await GlideClient.createClient(config),
            logger
        };
    }

    config_schema(): Terafoundation.Schema<GlideClientConfiguration> {
        return {
            addresses: {
                doc: 'DNS Addresses and ports of known nodes in the cluster. If the server is in cluster mode the list '
                    + 'can be partial, as the client will attempt to map out the cluster and find all nodes. If the '
                    + 'server is in standalone mode, only nodes whose addresses were provided will be used by the client.',
                default: null,
                format(val: any) {
                    if (!(Array.isArray(val))) {
                        throw new Error('must be an array');
                    }
                    val.forEach((obj, index) => {
                        const malformedAddresses: number[] = [];
                        if (!isKey(obj, 'host') || (isKey(obj, 'port') && typeof obj.port !== 'number')) {
                            malformedAddresses.push(index);
                        }
                        if (malformedAddresses.length) {
                            throw new Error(`must be an array of objects containing a host string and optional port number. Malformed addresses at these indices: ${malformedAddresses.toString()}.`);
                        }
                    });
                }
            },
            advancedConfiguration: {
                doc: 'Advanced client configuration. Supports "connectionTimeout" (ms), "pubsubReconciliationIntervalMs", '
                    + '"tcpNoDelay", and "tlsAdvancedConfiguration" ({ insecure?, rootCertificates? }).',
                default: undefined,
                format(val: any) {
                    if (val === undefined || val === null) return;
                    if (typeof val !== 'object') {
                        throw new Error('must be an object');
                    }
                    if (val.connectionTimeout !== undefined
                        && (typeof val.connectionTimeout !== 'number'
                            || !Number.isInteger(val.connectionTimeout)
                            || val.connectionTimeout <= 0)) {
                        throw new Error('"advancedConfiguration.connectionTimeout" must be a positive integer');
                    }
                    if (val.pubsubReconciliationIntervalMs !== undefined
                        && (typeof val.pubsubReconciliationIntervalMs !== 'number'
                            || !Number.isInteger(val.pubsubReconciliationIntervalMs)
                            || val.pubsubReconciliationIntervalMs <= 0)) {
                        throw new Error('"advancedConfiguration.pubsubReconciliationIntervalMs" must be a positive integer');
                    }
                    if (val.tcpNoDelay !== undefined && typeof val.tcpNoDelay !== 'boolean') {
                        throw new Error('"advancedConfiguration.tcpNoDelay" must be a boolean');
                    }
                    if (val.tlsAdvancedConfiguration !== undefined) {
                        const { tlsAdvancedConfiguration } = val;
                        if (typeof tlsAdvancedConfiguration !== 'object') {
                            throw new Error('"advancedConfiguration.tlsAdvancedConfiguration" must be an object');
                        }
                        if (tlsAdvancedConfiguration.insecure !== undefined
                            && typeof tlsAdvancedConfiguration.insecure !== 'boolean') {
                            throw new Error('"advancedConfiguration.tlsAdvancedConfiguration.insecure" must be a boolean');
                        }
                        if (tlsAdvancedConfiguration.rootCertificates !== undefined
                            && typeof tlsAdvancedConfiguration.rootCertificates !== 'string'
                            && !Buffer.isBuffer(tlsAdvancedConfiguration.rootCertificates)) {
                            throw new Error('"advancedConfiguration.tlsAdvancedConfiguration.rootCertificates" must be a string or Buffer');
                        }
                    }
                }
            },
            clientAz: {
                doc: 'Availability Zone of the client, used with AZAffinity and AZAffinityReplicasAndPrimary readFrom strategies.',
                default: undefined,
                format: 'optional_string'
            },
            clientName: {
                doc: 'Client name used with CLIENT SETNAME during connection establishment.',
                default: undefined,
                format: 'optional_string'
            },
            connectionBackoff: {
                doc: 'Strategy used to determine how and when to reconnect, in case of connection failures.',
                default: undefined,
                format(val: any) {
                    if (val === undefined || val === null) return;
                    if (typeof val !== 'object') {
                        throw new Error('must be an object');
                    }
                    if (!Number.isInteger(val.numberOfRetries) || val.numberOfRetries < 0) {
                        throw new Error('connectionBackoff.numberOfRetries" must be a non-negative integer');
                    }
                    if (!Number.isInteger(val.factor) || val.factor < 0) {
                        throw new Error('connectionBackoff.factor" must be a non-negative integer');
                    }
                    if (!Number.isInteger(val.exponentBase) || val.exponentBase < 0) {
                        throw new Error('connectionBackoff.exponentBase" must be a non-negative integer');
                    }
                    if (val.jitterPercent !== undefined
                        && (!Number.isInteger(val.jitterPercent) || val.jitterPercent < 0)) {
                        throw new Error('connectionBackoff.jitterPercent" must be a non-negative integer if provided');
                    }
                }
            },
            credentials: {
                doc: 'Credentials for authentication. Either { username?, password } for password auth, '
                    + 'or { username, iamConfig: { clusterName, service, region, refreshIntervalSeconds? } } for IAM auth. '
                    + '"service" must be "Elasticache" or "MemoryDB".',
                default: undefined,
                format(val: any) {
                    if (val === undefined || val === null) return;
                    if (typeof val !== 'object') {
                        throw new Error('must be an object');
                    }
                    if (val.iamConfig !== undefined) {
                        if (typeof val.username !== 'string') {
                            throw new Error('"credentials.username" is required for IAM auth');
                        }
                        const { iamConfig } = val;
                        if (typeof iamConfig !== 'object') {
                            throw new Error('"credentials.iamConfig" must be an object');
                        }
                        if (typeof iamConfig.clusterName !== 'string') {
                            throw new Error('"credentials.iamConfig.clusterName" must be a string');
                        }
                        if (iamConfig.service !== 'Elasticache' && iamConfig.service !== 'MemoryDB') {
                            throw new Error('"credentials.iamConfig.service" must be "Elasticache" or "MemoryDB"');
                        }
                        if (typeof iamConfig.region !== 'string') {
                            throw new Error('"credentials.iamConfig.region" must be a string');
                        }
                        if (iamConfig.refreshIntervalSeconds !== undefined
                            && (typeof iamConfig.refreshIntervalSeconds !== 'number'
                                || !Number.isInteger(iamConfig.refreshIntervalSeconds)
                                || iamConfig.refreshIntervalSeconds <= 0)) {
                            throw new Error('"credentials.iamConfig.refreshIntervalSeconds" must be a positive integer if provided');
                        }
                    } else {
                        if (typeof val.password !== 'string') {
                            throw new Error('"credentials.password" must be a string');
                        }
                        if (val.username !== undefined && typeof val.username !== 'string') {
                            throw new Error('"credentials.username" must be a string if provided');
                        }
                    }
                }
            },
            databaseId: {
                doc: 'Index of the logical database to connect to. Defaults to 0.',
                default: undefined,
                format(val: any) {
                    if (val !== undefined && (typeof val !== 'number' || val < 0 || !Number.isInteger(val))) {
                        throw new Error('must be a non-negative integer');
                    }
                }
            },
            defaultDecoder: {
                doc: 'Default decoder for responses when not set per command. One of: "Bytes", "String". Defaults to "String".',
                default: undefined,
                format(val: any) {
                    const valid = ['Bytes', 'String'];
                    if (val !== undefined && !valid.includes(val)) {
                        throw new Error(`must be one of: ${valid.join(', ')}`);
                    }
                }
            },
            inflightRequestsLimit: {
                doc: 'Maximum number of concurrent in-flight requests. Defaults to 1000.',
                default: undefined,
                format(val: any) {
                    if (val !== undefined && (typeof val !== 'number' || !Number.isInteger(val) || val <= 0)) {
                        throw new Error('must be a positive integer');
                    }
                }
            },
            lazyConnect: {
                doc: 'When true, defers physical connections until the first command is sent.',
                default: false,
                format: Boolean
            },
            protocol: {
                doc: 'Serialization protocol to use. One of: "RESP2", "RESP3". Defaults to "RESP3".',
                default: undefined,
                format(val: any) {
                    const valid = ['RESP2', 'RESP3'];
                    if (val !== undefined && !valid.includes(val)) {
                        throw new Error(`must be one of: ${valid.join(', ')}`);
                    }
                }
            },
            pubsubSubscriptions: {
                doc: 'PubSub subscriptions applied on connection. '
                    + '"channelsAndPatterns" is an object keyed by mode (0=Exact, 1=Pattern) with Sets of channel name strings. '
                    + '"callback" is an optional function receiving (msg, context). '
                    + '"context" is arbitrary data passed to the callback.',
                default: undefined,
                format(val: any) {
                    if (val === undefined || val === null) return;
                    if (typeof val !== 'object') {
                        throw new Error('must be an object');
                    }
                    if (typeof val.channelsAndPatterns !== 'object') {
                        throw new Error('"pubsubSubscriptions.channelsAndPatterns" must be an object');
                    }
                    for (const [mode, channels] of Object.entries(val.channelsAndPatterns)) {
                        if (mode !== '0' && mode !== '1') {
                            throw new Error('"pubsubSubscriptions.channelsAndPatterns" keys must be 0 (Exact) or 1 (Pattern)');
                        }
                        if (!(channels instanceof Set)) {
                            throw new Error(`"pubsubSubscriptions.channelsAndPatterns[${mode}]" must be a Set of strings`);
                        }
                        if (![...channels].every((c: any) => typeof c === 'string')) {
                            throw new Error(`"pubsubSubscriptions.channelsAndPatterns[${mode}]" must contain only strings`);
                        }
                    }
                    if (val.callback !== undefined && typeof val.callback !== 'function') {
                        throw new Error('"pubsubSubscriptions.callback" must be a function');
                    }
                }
            },
            readFrom: {
                doc: 'Client read from strategy. One of: "primary", "preferReplica", "AZAffinity", "AZAffinityReplicasAndPrimary". Defaults to "primary".',
                default: undefined,
                format(val: any) {
                    const valid = ['primary', 'preferReplica', 'AZAffinity', 'AZAffinityReplicasAndPrimary'];
                    if (val !== undefined && !valid.includes(val)) {
                        throw new Error(`must be one of: ${valid.join(', ')}`);
                    }
                }
            },
            readOnly: {
                doc: 'When true, enables read-only mode — write commands are blocked and all connected nodes are treated as valid read targets.',
                default: false,
                format: Boolean
            },
            requestTimeout: {
                doc: 'Duration in milliseconds the client should wait for a request to complete. Defaults to 250ms.',
                default: undefined,
                format(val: any) {
                    if (val !== undefined && (typeof val !== 'number' || !Number.isInteger(val) || val <= 0)) {
                        throw new Error('must be a positive integer');
                    }
                }
            },
            useTLS: {
                doc: 'True if communication with the server should use Transport Level Security.',
                default: false,
                format: Boolean
            }
        };
    }
}

const connector = new ValkeyConnector();

export default connector;
