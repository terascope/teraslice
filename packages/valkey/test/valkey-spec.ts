/* eslint-disable jest/expect-expect */
import { GlideClientConfiguration } from '@valkey/valkey-glide';
import { debugLogger, SchemaValidator } from '@terascope/core-utils';
import connector from '../src/index.js';
import { valkeyTestConfig } from './config.js';

const { VALKEY_HOSTNAME, VALKEY_PORT } = valkeyTestConfig;

const logger = debugLogger('valkey-client');

function makeValidator() {
    return new SchemaValidator(connector.config_schema(), 'valkeyConfigSchema', undefined, 'allow');
}

const baseConfig = {
    addresses: [{ host: 'localhost', port: 6379 }]
};

function validate(extra: Record<string, unknown> = {}) {
    return makeValidator().validate({ ...baseConfig, ...extra });
}

function expectThrows(extra: Record<string, unknown>, match: string | RegExp) {
    try {
        validate(extra);
        throw new Error('Expected to throw but did not');
    } catch (e: any) {
        if (e.message === 'Expected to throw but did not') throw e;
        // SchemaValidator JSON-serializes Zod errors, so " becomes \" in the message.
        // Normalize before matching so callers can write plain double-quoted field names.
        const normalized = e.message.replace(/\\"/g, '"');
        if (typeof match === 'string') {
            expect(normalized).toContain(match);
        } else {
            expect(normalized).toMatch(match);
        }
    }
}

describe('config_schema()', () => {
    it('returns an object with all expected top-level keys', () => {
        const schema = connector.config_schema();
        const expectedKeys = [
            'addresses',
            'advancedConfiguration',
            'clientAz',
            'clientName',
            'connectionBackoff',
            'credentials',
            'databaseId',
            'defaultDecoder',
            'inflightRequestsLimit',
            'lazyConnect',
            'protocol',
            'pubsubSubscriptions',
            'readFrom',
            'readOnly',
            'requestTimeout',
            'useTLS'
        ];
        for (const key of expectedKeys) {
            expect(schema).toHaveProperty(key);
        }
    });

    describe('addresses', () => {
        it('passes with host only', () => {
            expect(() => validate({ addresses: [{ host: 'localhost' }] })).not.toThrow();
        });

        it('passes with host and port', () => {
            expect(() => validate()).not.toThrow();
        });

        it('throws when not an array', () => {
            expectThrows({ addresses: 'localhost:6379' }, 'must be an array');
        });

        it('throws when an entry is missing host', () => {
            expectThrows({ addresses: [{ port: 6379 }] }, /Malformed addresses/);
        });

        it('throws when port is not a number', () => {
            expectThrows({ addresses: [{ host: 'localhost', port: '6379' }] }, /Malformed addresses/);
        });
    });

    describe('advancedConfiguration', () => {
        it('passes when undefined', () => {
            expect(() => validate({ advancedConfiguration: undefined })).not.toThrow();
        });

        it('throws when not an object', () => {
            expectThrows({ advancedConfiguration: 'fast' }, 'must be an object');
        });

        it('throws when connectionTimeout is zero', () => {
            expectThrows({ advancedConfiguration: { connectionTimeout: 0 } }, '"advancedConfiguration.connectionTimeout" must be a positive integer');
        });

        it('throws when connectionTimeout is a float', () => {
            expectThrows({ advancedConfiguration: { connectionTimeout: 1.5 } }, '"advancedConfiguration.connectionTimeout" must be a positive integer');
        });

        it('passes when connectionTimeout is a positive integer', () => {
            expect(() => validate({ advancedConfiguration: { connectionTimeout: 5000 } }))
                .not.toThrow();
        });

        it('throws when pubsubReconciliationIntervalMs is zero', () => {
            expectThrows({ advancedConfiguration: { pubsubReconciliationIntervalMs: 0 } }, '"advancedConfiguration.pubsubReconciliationIntervalMs" must be a positive integer');
        });

        it('throws when tcpNoDelay is not a boolean', () => {
            expectThrows({ advancedConfiguration: { tcpNoDelay: 1 } }, '"advancedConfiguration.tcpNoDelay" must be a boolean');
        });

        it('passes when tcpNoDelay is a boolean', () => {
            expect(() => validate({ advancedConfiguration: { tcpNoDelay: true } })).not.toThrow();
        });

        it('throws when tlsAdvancedConfiguration is not an object', () => {
            expectThrows({ advancedConfiguration: { tlsAdvancedConfiguration: 'true' } }, '"advancedConfiguration.tlsAdvancedConfiguration" must be an object');
        });

        it('throws when tlsAdvancedConfiguration.insecure is not a boolean', () => {
            expectThrows({ advancedConfiguration: { tlsAdvancedConfiguration: { insecure: 'yes' } } }, '"advancedConfiguration.tlsAdvancedConfiguration.insecure" must be a boolean');
        });

        it('throws when tlsAdvancedConfiguration.rootCertificates is not a string or Buffer', () => {
            expectThrows({ advancedConfiguration: { tlsAdvancedConfiguration: { rootCertificates: 123 } } }, '"advancedConfiguration.tlsAdvancedConfiguration.rootCertificates" must be a string or Buffer');
        });

        it('passes when tlsAdvancedConfiguration.rootCertificates is a string', () => {
            expect(() => validate({ advancedConfiguration: { tlsAdvancedConfiguration: { rootCertificates: 'cert' } } })).not.toThrow();
        });

        it('passes when tlsAdvancedConfiguration.rootCertificates is a Buffer', () => {
            expect(() => validate({ advancedConfiguration: { tlsAdvancedConfiguration: { rootCertificates: Buffer.from('cert') } } })).not.toThrow();
        });
    });

    describe('connectionBackoff', () => {
        const validBackoff = { numberOfRetries: 3, factor: 2, exponentBase: 2 };

        it('passes with valid backoff config', () => {
            expect(() => validate({ connectionBackoff: validBackoff })).not.toThrow();
        });

        it('passes when undefined', () => {
            expect(() => validate({ connectionBackoff: undefined })).not.toThrow();
        });

        it('throws when not an object', () => {
            expectThrows({ connectionBackoff: 'retry' }, 'must be an object');
        });

        it('throws when numberOfRetries is negative', () => {
            expectThrows({ connectionBackoff: { ...validBackoff, numberOfRetries: -1 } }, 'numberOfRetries');
        });

        it('throws when factor is a float', () => {
            expectThrows({ connectionBackoff: { ...validBackoff, factor: 1.5 } }, 'factor');
        });

        it('throws when exponentBase is negative', () => {
            expectThrows({ connectionBackoff: { ...validBackoff, exponentBase: -1 } }, 'exponentBase');
        });

        it('throws when jitterPercent is negative', () => {
            expectThrows({ connectionBackoff: { ...validBackoff, jitterPercent: -5 } }, 'jitterPercent');
        });

        it('passes when jitterPercent is a non-negative integer', () => {
            expect(() => validate({ connectionBackoff: { ...validBackoff, jitterPercent: 10 } }))
                .not.toThrow();
        });
    });

    describe('credentials', () => {
        it('passes when undefined', () => {
            expect(() => validate({ credentials: undefined })).not.toThrow();
        });

        it('throws when not an object', () => {
            expectThrows({ credentials: 'secret' }, 'must be an object');
        });

        describe('password auth', () => {
            it('passes with password only', () => {
                expect(() => validate({ credentials: { password: 'secret' } })).not.toThrow();
            });

            it('passes with username and password', () => {
                expect(() => validate({ credentials: { username: 'user', password: 'secret' } })).not.toThrow();
            });

            it('throws when password is missing', () => {
                expectThrows({ credentials: {} }, '"credentials.password" must be a string');
            });

            it('throws when username is not a string', () => {
                expectThrows({ credentials: { username: 42, password: 'secret' } }, '"credentials.username" must be a string if provided');
            });
        });

        describe('IAM auth', () => {
            const validIam = {
                username: 'user',
                iamConfig: { clusterName: 'my-cluster', service: 'Elasticache', region: 'us-east-1' }
            };

            it('passes with valid IAM config', () => {
                expect(() => validate({ credentials: validIam })).not.toThrow();
            });

            it('passes with MemoryDB service', () => {
                expect(() => validate({ credentials: { ...validIam, iamConfig: { ...validIam.iamConfig, service: 'MemoryDB' } } })).not.toThrow();
            });

            it('throws when username is missing for IAM auth', () => {
                const { username: _u, ...noUsername } = validIam;
                expectThrows({ credentials: noUsername }, '"credentials.username" is required for IAM auth');
            });

            it('throws when iamConfig is not an object', () => {
                expectThrows({ credentials: { username: 'user', iamConfig: 'config' } }, '"credentials.iamConfig" must be an object');
            });

            it('throws when clusterName is not a string', () => {
                expectThrows({ credentials: { ...validIam, iamConfig: { ...validIam.iamConfig, clusterName: 99 } } }, '"credentials.iamConfig.clusterName" must be a string');
            });

            it('throws when service is invalid', () => {
                expectThrows({ credentials: { ...validIam, iamConfig: { ...validIam.iamConfig, service: 'Redis' } } }, '"credentials.iamConfig.service" must be "Elasticache" or "MemoryDB"');
            });

            it('throws when region is not a string', () => {
                expectThrows({ credentials: { ...validIam, iamConfig: { ...validIam.iamConfig, region: 1 } } }, '"credentials.iamConfig.region" must be a string');
            });

            it('throws when refreshIntervalSeconds is zero', () => {
                expectThrows({ credentials: { ...validIam, iamConfig: { ...validIam.iamConfig, refreshIntervalSeconds: 0 } } }, '"credentials.iamConfig.refreshIntervalSeconds" must be a positive integer if provided');
            });

            it('throws when refreshIntervalSeconds is a float', () => {
                expectThrows({ credentials: { ...validIam, iamConfig: { ...validIam.iamConfig, refreshIntervalSeconds: 1.5 } } }, '"credentials.iamConfig.refreshIntervalSeconds" must be a positive integer if provided');
            });

            it('passes when refreshIntervalSeconds is a positive integer', () => {
                expect(() => validate(
                    {
                        credentials: {
                            ...validIam,
                            iamConfig: { ...validIam.iamConfig, refreshIntervalSeconds: 300 }
                        }
                    }
                )).not.toThrow();
            });
        });
    });

    describe('databaseId', () => {
        it('passes when undefined', () => {
            expect(() => validate({ databaseId: undefined })).not.toThrow();
        });

        it('passes with 0', () => {
            expect(() => validate({ databaseId: 0 })).not.toThrow();
        });

        it('passes with a positive integer', () => {
            expect(() => validate({ databaseId: 3 })).not.toThrow();
        });

        it('throws when negative', () => {
            expectThrows({ databaseId: -1 }, 'must be a non-negative integer');
        });

        it('throws when a float', () => {
            expectThrows({ databaseId: 1.5 }, 'must be a non-negative integer');
        });
    });

    describe('defaultDecoder', () => {
        it('passes with "Bytes"', () => {
            expect(() => validate({ defaultDecoder: 'Bytes' })).not.toThrow();
        });

        it('passes with "String"', () => {
            expect(() => validate({ defaultDecoder: 'String' })).not.toThrow();
        });

        it('throws with an invalid value', () => {
            expectThrows({ defaultDecoder: 'utf8' }, 'must be one of: Bytes, String');
        });
    });

    describe('inflightRequestsLimit', () => {
        it('passes when undefined', () => {
            expect(() => validate({ inflightRequestsLimit: undefined })).not.toThrow();
        });

        it('passes with a positive integer', () => {
            expect(() => validate({ inflightRequestsLimit: 500 })).not.toThrow();
        });

        it('throws when zero', () => {
            expectThrows({ inflightRequestsLimit: 0 }, 'must be a positive integer');
        });

        it('throws when a float', () => {
            expectThrows({ inflightRequestsLimit: 1.5 }, 'must be a positive integer');
        });
    });

    describe('protocol', () => {
        it('passes with "RESP2"', () => {
            expect(() => validate({ protocol: 'RESP2' })).not.toThrow();
        });

        it('passes with "RESP3"', () => {
            expect(() => validate({ protocol: 'RESP3' })).not.toThrow();
        });

        it('throws with an invalid value', () => {
            expectThrows({ protocol: 'RESP4' }, 'must be one of: RESP2, RESP3');
        });
    });

    describe('pubsubSubscriptions', () => {
        it('passes when undefined', () => {
            expect(() => validate({ pubsubSubscriptions: undefined })).not.toThrow();
        });

        it('throws when not an object', () => {
            expectThrows({ pubsubSubscriptions: 'sub' }, 'must be an object');
        });

        it('throws when channelsAndPatterns is missing', () => {
            expectThrows({ pubsubSubscriptions: {} }, '"pubsubSubscriptions.channelsAndPatterns" must be an object');
        });

        it('throws when a mode key is not 0 or 1', () => {
            expectThrows({
                pubsubSubscriptions: { channelsAndPatterns: { 2: new Set(['chan']) } }
            }, '"pubsubSubscriptions.channelsAndPatterns" keys must be 0 (Exact) or 1 (Pattern)');
        });

        it('throws when channels is not a Set', () => {
            expectThrows({
                pubsubSubscriptions: { channelsAndPatterns: { 0: ['chan'] } }
            }, /must be a Set/);
        });

        it('throws when a Set contains non-strings', () => {
            expectThrows({
                pubsubSubscriptions: { channelsAndPatterns: { 0: new Set([1, 2]) } }
            }, /must contain only strings/);
        });

        it('throws when callback is not a function', () => {
            expectThrows({
                pubsubSubscriptions: { channelsAndPatterns: { 0: new Set(['chan']) }, callback: 'fn' }
            }, '"pubsubSubscriptions.callback" must be a function');
        });

        it('passes with valid exact-channel subscription and callback', () => {
            expect(() => validate({
                pubsubSubscriptions: {
                    channelsAndPatterns: { 0: new Set(['chan1', 'chan2']) },
                    callback: () => { }
                }
            })).not.toThrow();
        });
    });

    describe('readFrom', () => {
        it.each(['primary', 'preferReplica', 'AZAffinity', 'AZAffinityReplicasAndPrimary'])(
            'passes with "%s"',
            (value) => {
                expect(() => validate({ readFrom: value })).not.toThrow();
            }
        );

        it('throws with an invalid value', () => {
            expectThrows({ readFrom: 'replica' }, /must be one of/);
        });
    });

    describe('requestTimeout', () => {
        it('passes when undefined', () => {
            expect(() => validate({ requestTimeout: undefined })).not.toThrow();
        });

        it('passes with a positive integer', () => {
            expect(() => validate({ requestTimeout: 500 })).not.toThrow();
        });

        it('throws when zero', () => {
            expectThrows({ requestTimeout: 0 }, 'must be a positive integer');
        });

        it('throws when a float', () => {
            expectThrows({ requestTimeout: 0.5 }, 'must be a positive integer');
        });
    });
});

describe('Valkey Client', () => {
    it('will throw with invalid address', async () => {
        const badConfig: GlideClientConfiguration = {
            addresses: [{ host: VALKEY_HOSTNAME, port: VALKEY_PORT + 1 }]
        };

        const validator = new SchemaValidator<GlideClientConfiguration>(
            connector.config_schema(),
            'valkeyConfigSchema',
            undefined,
            'allow'
        );
        const validatedConfig = validator.validate(badConfig);

        await expect(connector.createClient(validatedConfig, logger)).rejects.toThrow();
    });

    it('will create a basic client', async () => {
        const config: GlideClientConfiguration = {
            addresses: [{ host: VALKEY_HOSTNAME, port: VALKEY_PORT }]
        };

        const validator = new SchemaValidator<GlideClientConfiguration>(
            connector.config_schema(),
            'valkeyConfigSchema',
            undefined,
            'allow'
        );
        const validatedConfig = validator.validate(config);

        const conn = await connector.createClient(validatedConfig, logger);

        expect(conn.logger).toBe(logger);
        await expect(conn.client.ping()).resolves.toBe('PONG');

        await conn.client.set('key1', 'value1');
        await expect(conn.client.get('key1')).resolves.toBe('value1');

        await conn.client.set('key2', 'value2');
        await expect(conn.client.exists(['key2'])).resolves.toBe(1);
        await conn.client.del(['key2']);
        await expect(conn.client.get('key2')).resolves.toBe(null);
        await expect(conn.client.exists(['key2'])).resolves.toBe(0);

        conn.client.close();
    });
});
