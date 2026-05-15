/* eslint-disable jest/expect-expect */
import { GlideClientConfiguration, GeoUnit, SortOrder, GlideJson } from '@valkey/valkey-glide';
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

function expectValidateToThrow(extra: Record<string, unknown>, match: string | RegExp) {
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
            expectValidateToThrow({ addresses: 'localhost:6379' }, 'must be an array');
        });

        it('throws when an entry is missing host', () => {
            expectValidateToThrow({ addresses: [{ port: 6379 }] }, /Malformed addresses/);
        });

        it('throws when port is not a number', () => {
            expectValidateToThrow({ addresses: [{ host: 'localhost', port: '6379' }] }, /Malformed addresses/);
        });
    });

    describe('advancedConfiguration', () => {
        it('passes when undefined', () => {
            expect(() => validate({ advancedConfiguration: undefined })).not.toThrow();
        });

        it('throws when not an object', () => {
            expectValidateToThrow({ advancedConfiguration: 'fast' }, 'must be an object');
        });

        it('throws when connectionTimeout is zero', () => {
            expectValidateToThrow({ advancedConfiguration: { connectionTimeout: 0 } }, '"advancedConfiguration.connectionTimeout" must be a positive integer');
        });

        it('throws when connectionTimeout is a float', () => {
            expectValidateToThrow({ advancedConfiguration: { connectionTimeout: 1.5 } }, '"advancedConfiguration.connectionTimeout" must be a positive integer');
        });

        it('passes when connectionTimeout is a positive integer', () => {
            expect(() => validate({ advancedConfiguration: { connectionTimeout: 5000 } }))
                .not.toThrow();
        });

        it('throws when pubsubReconciliationIntervalMs is zero', () => {
            expectValidateToThrow({ advancedConfiguration: { pubsubReconciliationIntervalMs: 0 } }, '"advancedConfiguration.pubsubReconciliationIntervalMs" must be a positive integer');
        });

        it('throws when tcpNoDelay is not a boolean', () => {
            expectValidateToThrow({ advancedConfiguration: { tcpNoDelay: 1 } }, '"advancedConfiguration.tcpNoDelay" must be a boolean');
        });

        it('passes when tcpNoDelay is a boolean', () => {
            expect(() => validate({ advancedConfiguration: { tcpNoDelay: true } })).not.toThrow();
        });

        it('throws when tlsAdvancedConfiguration is not an object', () => {
            expectValidateToThrow({ advancedConfiguration: { tlsAdvancedConfiguration: 'true' } }, '"advancedConfiguration.tlsAdvancedConfiguration" must be an object');
        });

        it('throws when tlsAdvancedConfiguration.insecure is not a boolean', () => {
            expectValidateToThrow({ advancedConfiguration: { tlsAdvancedConfiguration: { insecure: 'yes' } } }, '"advancedConfiguration.tlsAdvancedConfiguration.insecure" must be a boolean');
        });

        it('throws when tlsAdvancedConfiguration.rootCertificates is not a string or Buffer', () => {
            expectValidateToThrow({ advancedConfiguration: { tlsAdvancedConfiguration: { rootCertificates: 123 } } }, '"advancedConfiguration.tlsAdvancedConfiguration.rootCertificates" must be a string or Buffer');
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
            expectValidateToThrow({ connectionBackoff: 'retry' }, 'must be an object');
        });

        it('throws when numberOfRetries is negative', () => {
            expectValidateToThrow({ connectionBackoff: { ...validBackoff, numberOfRetries: -1 } }, 'numberOfRetries');
        });

        it('throws when factor is a float', () => {
            expectValidateToThrow({ connectionBackoff: { ...validBackoff, factor: 1.5 } }, 'factor');
        });

        it('throws when exponentBase is negative', () => {
            expectValidateToThrow({ connectionBackoff: { ...validBackoff, exponentBase: -1 } }, 'exponentBase');
        });

        it('throws when jitterPercent is negative', () => {
            expectValidateToThrow({ connectionBackoff: { ...validBackoff, jitterPercent: -5 } }, 'jitterPercent');
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
            expectValidateToThrow({ credentials: 'secret' }, 'must be an object');
        });

        describe('password auth', () => {
            it('passes with password only', () => {
                expect(() => validate({ credentials: { password: 'secret' } })).not.toThrow();
            });

            it('passes with username and password', () => {
                expect(() => validate({ credentials: { username: 'user', password: 'secret' } })).not.toThrow();
            });

            it('throws when password is missing', () => {
                expectValidateToThrow({ credentials: {} }, '"credentials.password" must be a string');
            });

            it('throws when username is not a string', () => {
                expectValidateToThrow({ credentials: { username: 42, password: 'secret' } }, '"credentials.username" must be a string if provided');
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
                expectValidateToThrow({ credentials: noUsername }, '"credentials.username" is required for IAM auth');
            });

            it('throws when iamConfig is not an object', () => {
                expectValidateToThrow({ credentials: { username: 'user', iamConfig: 'config' } }, '"credentials.iamConfig" must be an object');
            });

            it('throws when clusterName is not a string', () => {
                expectValidateToThrow({ credentials: { ...validIam, iamConfig: { ...validIam.iamConfig, clusterName: 99 } } }, '"credentials.iamConfig.clusterName" must be a string');
            });

            it('throws when service is invalid', () => {
                expectValidateToThrow({ credentials: { ...validIam, iamConfig: { ...validIam.iamConfig, service: 'Redis' } } }, '"credentials.iamConfig.service" must be "Elasticache" or "MemoryDB"');
            });

            it('throws when region is not a string', () => {
                expectValidateToThrow({ credentials: { ...validIam, iamConfig: { ...validIam.iamConfig, region: 1 } } }, '"credentials.iamConfig.region" must be a string');
            });

            it('throws when refreshIntervalSeconds is zero', () => {
                expectValidateToThrow({ credentials: { ...validIam, iamConfig: { ...validIam.iamConfig, refreshIntervalSeconds: 0 } } }, '"credentials.iamConfig.refreshIntervalSeconds" must be a positive integer if provided');
            });

            it('throws when refreshIntervalSeconds is a float', () => {
                expectValidateToThrow({ credentials: { ...validIam, iamConfig: { ...validIam.iamConfig, refreshIntervalSeconds: 1.5 } } }, '"credentials.iamConfig.refreshIntervalSeconds" must be a positive integer if provided');
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
            expectValidateToThrow({ databaseId: -1 }, 'must be a non-negative integer');
        });

        it('throws when a float', () => {
            expectValidateToThrow({ databaseId: 1.5 }, 'must be a non-negative integer');
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
            expectValidateToThrow({ defaultDecoder: 'utf8' }, 'must be one of: Bytes, String');
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
            expectValidateToThrow({ inflightRequestsLimit: 0 }, 'must be a positive integer');
        });

        it('throws when a float', () => {
            expectValidateToThrow({ inflightRequestsLimit: 1.5 }, 'must be a positive integer');
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
            expectValidateToThrow({ protocol: 'RESP4' }, 'must be one of: RESP2, RESP3');
        });
    });

    describe('pubsubSubscriptions', () => {
        it('passes when undefined', () => {
            expect(() => validate({ pubsubSubscriptions: undefined })).not.toThrow();
        });

        it('throws when not an object', () => {
            expectValidateToThrow({ pubsubSubscriptions: 'sub' }, 'must be an object');
        });

        it('throws when channelsAndPatterns is missing', () => {
            expectValidateToThrow({ pubsubSubscriptions: {} }, '"pubsubSubscriptions.channelsAndPatterns" must be an object');
        });

        it('throws when a mode key is not 0 or 1', () => {
            expectValidateToThrow({
                pubsubSubscriptions: { channelsAndPatterns: { 2: new Set(['chan']) } }
            }, '"pubsubSubscriptions.channelsAndPatterns" keys must be 0 (Exact) or 1 (Pattern)');
        });

        it('throws when channels is not a Set', () => {
            expectValidateToThrow({
                pubsubSubscriptions: { channelsAndPatterns: { 0: ['chan'] } }
            }, /must be a Set/);
        });

        it('throws when a Set contains non-strings', () => {
            expectValidateToThrow({
                pubsubSubscriptions: { channelsAndPatterns: { 0: new Set([1, 2]) } }
            }, /must contain only strings/);
        });

        it('throws when callback is not a function', () => {
            expectValidateToThrow({
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
            expectValidateToThrow({ readFrom: 'replica' }, /must be one of/);
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
            expectValidateToThrow({ requestTimeout: 0 }, 'must be a positive integer');
        });

        it('throws when a float', () => {
            expectValidateToThrow({ requestTimeout: 0.5 }, 'must be a positive integer');
        });
    });
});

describe('Valkey Client', () => {
    it('will throw with invalid address', async () => {
        const badConfig: GlideClientConfiguration = {
            addresses: [{ host: VALKEY_HOSTNAME, port: 65000 }]
        };

        const validator = new SchemaValidator<GlideClientConfiguration>(
            connector.config_schema(),
            'valkeyConfigSchema',
            undefined,
            'allow'
        );
        const validatedConfig = validator.validate(badConfig);

        expect(badConfig.addresses[0].port).not.toBe(VALKEY_PORT);
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

    describe('commands', () => {
        let conn: Awaited<ReturnType<typeof connector.createClient>>;

        beforeAll(async () => {
            const config: GlideClientConfiguration = {
                addresses: [{ host: VALKEY_HOSTNAME, port: VALKEY_PORT }]
            };
            const validator = new SchemaValidator<GlideClientConfiguration>(
                connector.config_schema(),
                'valkeyConfigSchema',
                undefined,
                'allow'
            );
            conn = await connector.createClient(validator.validate(config), logger);
        });

        afterAll(async () => {
            await conn.client.del(['mkey1', 'mkey2', 'counter', 'Sicily', 'searchAreaPlain', 'searchArea']);
            conn.client.close();
        });

        describe('mset / mget', () => {
            it('sets and gets multiple keys', async () => {
                await conn.client.mset({ mkey1: 'goodbye', mkey2: 'Bob' });
                await expect(conn.client.mget(['mkey1', 'mkey2'])).resolves.toEqual(['goodbye', 'Bob']);
            });
        });

        describe('incr / decr', () => {
            it('increments a counter', async () => {
                await conn.client.set('counter', '10');
                await expect(conn.client.incr('counter')).resolves.toBe(11);
                await expect(conn.client.get('counter')).resolves.toBe('11');
            });

            it('decrements a counter', async () => {
                await conn.client.set('counter', '11');
                await expect(conn.client.decr('counter')).resolves.toBe(10);
                await expect(conn.client.get('counter')).resolves.toBe('10');
            });
        });

        describe('geoadd / geopos', () => {
            it('returns positions for added members', async () => {
                await conn.client.geoadd(
                    'Sicily',
                    new Map([
                        ['Palermo', { longitude: 13.361389, latitude: 38.115556 }],
                        ['Catania', { longitude: 15.087269, latitude: 37.502669 }]
                    ])
                );
                const positions = await conn.client.geopos('Sicily', ['Palermo', 'Catania']) as [number, number][];
                expect(positions).toHaveLength(2);
                expect(positions[0][0]).toBeCloseTo(13.361389, 4);
                expect(positions[0][1]).toBeCloseTo(38.115556, 4);
                expect(positions[1][0]).toBeCloseTo(15.087269, 4);
                expect(positions[1][1]).toBeCloseTo(37.502669, 4);
            });
        });

        describe('geodist', () => {
            it('returns distance between two members in kilometers', async () => {
                const dist = await conn.client.geodist('Sicily', 'Palermo', 'Catania', { unit: GeoUnit.KILOMETERS });
                expect(dist).toBeCloseTo(166.2742, 2);
            });
        });

        describe('geosearch', () => {
            it('BYRADIUS FROMLONLAT returns members sorted ASC with dist and coord', async () => {
                const results = await conn.client.geosearch(
                    'Sicily',
                    { position: { longitude: 13.36, latitude: 38.1 } },
                    { radius: 300, unit: GeoUnit.KILOMETERS },
                    { sortOrder: SortOrder.ASC, withDist: true, withCoord: true }
                ) as unknown as [string, [number, [number, number]]][];
                expect(results).toHaveLength(2);
                expect(results[0][0]).toBe('Palermo');
                expect(results[1][0]).toBe('Catania');
                const [palermoDist, palermoCoord] = results[0][1];
                expect(palermoDist).toBeCloseTo(1.7345, 2);
                expect(palermoCoord[0]).toBeCloseTo(13.361389, 4);
                expect(palermoCoord[1]).toBeCloseTo(38.115556, 4);
            });

            it('BYBOX FROMMEMBER returns members sorted DESC with dist', async () => {
                const results = await conn.client.geosearch(
                    'Sicily',
                    { member: 'Palermo' },
                    { width: 500, height: 500, unit: GeoUnit.KILOMETERS },
                    { sortOrder: SortOrder.DESC, withDist: true, count: 3 }
                ) as [string, [number]][];
                expect(results).toHaveLength(2);
                expect(results[0][0]).toBe('Catania');
                expect(results[1][0]).toBe('Palermo');
                expect(results[0][1][0]).toBeCloseTo(166.2742, 2);
                expect(results[1][1][0]).toBe(0);
            });

            it('BYPOLYGON using GlideJson returns members within polygon', async () => {
                await GlideJson.set(conn.client, 'searchArea', '$', JSON.stringify({
                    type: 'Polygon',
                    coordinates: [[
                        ['13', '36'], ['14', '36'], ['14', '39'], ['13', '39'], ['13', '36']
                    ]]
                }));
                const searchAreaStr = await GlideJson.get(conn.client, 'searchArea');
                expect(searchAreaStr).not.toBeNull();
                const coords: [string, string][] = JSON
                    .parse(searchAreaStr as string)
                    .coordinates[0];
                const polygonArgs = coords.flatMap(([lon, lat]) => [lon, lat]);
                const result = await conn.client.customCommand([
                    'GEOSEARCH',
                    'Sicily',
                    'BYPOLYGON',
                    coords.length.toString(),
                    ...polygonArgs,
                    'WITHCOORD'
                ]) as any[];
                expect(Array.isArray(result)).toBe(true);
                const names = result.map(([name]: [string]) => name);
                expect(names).toContain('Palermo');
            });

            it('BYPOLYGON using customCommand returns members within polygon', async () => {
                const coords: [string, string][] = [
                    ['13', '36'], ['14', '36'], ['14', '39'], ['13', '39'], ['13', '36']
                ];
                await conn.client.set('searchAreaPlain', JSON.stringify(coords));
                const stored = await conn.client.get('searchAreaPlain');
                const parsed: [string, string][] = JSON.parse(stored as string);
                const polygonArgs = parsed.flatMap(([lon, lat]) => [lon, lat]);
                const result = await conn.client.customCommand([
                    'GEOSEARCH',
                    'Sicily',
                    'BYPOLYGON',
                    parsed.length.toString(),
                    ...polygonArgs,
                    'WITHCOORD'
                ]) as any[];
                expect(Array.isArray(result)).toBe(true);
                const names = result.map(([name]: [string]) => name);
                expect(names).toContain('Palermo');
            });
        });
    });
});
