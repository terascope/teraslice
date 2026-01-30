import 'jest-extended';
import type { ConnectionOptions } from 'node:tls';
import ElasticsearchConnector, { sslKeys } from '../../src/connectors/elasticsearch-next.js';
import { SchemaValidator } from '@terascope/core-utils';

describe('elasticsearch-next', () => {
    describe('schema inline format fns', () => {
        describe('ssl', () => {
            // Compile-time check: sslKeys must match the keys of tls.ConnectionOptions.
            // If Node.js adds or removes keys from ConnectionOptions, this will produce a type
            // error showing which key(s) are out of sync.
            type SslKeysUnion = (typeof sslKeys)[number];
            type MissingKeys = Exclude<keyof ConnectionOptions, SslKeysUnion>;
            type ExtraKeys = Exclude<SslKeysUnion, keyof ConnectionOptions>;

            // These assignments only compile when MissingKeys / ExtraKeys resolve to `never`.
            const _assertNoMissingKeys: [MissingKeys] extends [never] ? true : MissingKeys = true;
            const _assertNoExtraKeys: [ExtraKeys] extends [never] ? true : ExtraKeys = true;
            void _assertNoMissingKeys;
            void _assertNoExtraKeys;

            it('should throw for unrecognized keys', async () => {
                const schema = ElasticsearchConnector.config_schema();
                const connectorConfig = {
                    ssl: {
                        missingKey: 'someValue'
                    }
                };

                const validator = new SchemaValidator(schema, 'es-next');
                expect(() => validator.validate(connectorConfig)).toThrow(/Unrecognized keys on \\"ssl\\" object: missingKey/);
            });
        });
    });

    describe('validate_config', () => {
        it('should throw if auth and username are both set', () => {
            const config = {
                auth: { username: 'user', password: 'pass' },
                username: 'user',
            } as any;

            expect(() => ElasticsearchConnector.validate_config!(config, {} as any))
                .toThrow('"auth" can not be set at the same time as "username" or "password".');
        });

        it('should throw if auth and password are both set', () => {
            const config = {
                auth: { username: 'user', password: 'pass' },
                password: 'pass',
            } as any;

            expect(() => ElasticsearchConnector.validate_config!(config, {} as any))
                .toThrow('"auth" can not be set at the same time as "username" or "password".');
        });

        it('should throw if username is set without password', () => {
            const config = {
                username: 'user',
            } as any;

            expect(() => ElasticsearchConnector.validate_config!(config, {} as any))
                .toThrow('Both "username" and "password" must be provided when one is set');
        });

        it('should throw if password is set without username', () => {
            const config = {
                password: 'pass',
            } as any;

            expect(() => ElasticsearchConnector.validate_config!(config, {} as any))
                .toThrow('Both "username" and "password" must be provided when one is set');
        });

        it('should throw if caCertificate and ssl.ca are both set with different values', () => {
            const config = {
                caCertificate: 'cert-a',
                ssl: { ca: 'cert-b' },
            } as any;

            expect(() => ElasticsearchConnector.validate_config!(config, {} as any))
                .toThrow('Cannot set both "caCertificate" and "ssl.ca".');
        });

        it('should not throw if caCertificate and ssl.ca are the same value', () => {
            const config = {
                caCertificate: 'same-cert',
                ssl: { ca: 'same-cert' },
            } as any;

            expect(() => ElasticsearchConnector.validate_config!(config, {} as any))
                .not.toThrow();
        });

        it('should not throw with valid username and password', () => {
            const config = {
                username: 'user',
                password: 'pass',
            } as any;

            expect(() => ElasticsearchConnector.validate_config!(config, {} as any))
                .not.toThrow();
        });

        it('should not throw with valid auth object', () => {
            const config = {
                auth: { username: 'user', password: 'pass' },
            } as any;

            expect(() => ElasticsearchConnector.validate_config!(config, {} as any))
                .not.toThrow();
        });

        it('should not throw with no auth fields set', () => {
            const config = {} as any;

            expect(() => ElasticsearchConnector.validate_config!(config, {} as any))
                .not.toThrow();
        });
    });
});
