import { jest } from '@jest/globals';
import { debugLogger, get } from '@terascope/core-utils';
import { createClient, formatClientConfig, ElasticsearchTestHelpers } from '../src/index.js';
import { OpenSearch } from '@terascope/types';

describe('create-client', () => {
    describe('can create an elasticsearch or opensearch client', () => {
        const testLogger = debugLogger('create-client-test');

        const {
            host, distribution: testDist,
            version: testVersion, majorVersion: testMajorVersion,
            minorVersion: testMinorVersion
        } = ElasticsearchTestHelpers.getTestENVClientInfo();

        it('can make a client', async () => {
            const { client, log } = await createClient({ node: host }, testLogger);

            expect(client).toBeDefined();
            expect(log).toBeDefined();

            const metadata = get(client, '__meta');
            expect(metadata).toBeDefined();

            const {
                distribution, version, majorVersion, minorVersion
            } = metadata;

            expect(distribution).toEqual(testDist);
            expect(version).toEqual(testVersion);
            expect(majorVersion).toEqual(testMajorVersion);
            expect(minorVersion).toEqual(testMinorVersion);
        });

        it('should not throw when config contains a field that does not exist', async () => {
            const config = {
                node: host,
                nonExistentField: 'some-value'
            } as OpenSearch.ClientConfig;

            await expect(createClient(config, testLogger)).resolves.not.toThrow();
        });
    });

    describe('formatClientConfig', () => {
        const logger = debugLogger('format-client-config-test');

        it('should return config unchanged when no auth fields are set', () => {
            const config: OpenSearch.ClientConfig = {
                node: 'http://localhost:9200'
            };

            const result = formatClientConfig(config, logger);

            expect(result).toEqual({ node: 'http://localhost:9200' });
        });

        it('should not mutate the original config object', () => {
            const config: OpenSearch.ClientConfig = {
                node: 'http://localhost:9200',
                username: 'user',
                password: 'pass'
            };

            const original = { ...config };
            formatClientConfig(config, logger);

            expect(config).toEqual(original);
        });

        it('should set auth from username and password', () => {
            const config: OpenSearch.ClientConfig = {
                node: 'https://localhost:9200',
                username: 'user',
                password: 'pass'
            };

            const result = formatClientConfig(config, logger);

            expect(result.auth).toEqual({ username: 'user', password: 'pass' });
        });

        it('should throw if only username is provided without password', () => {
            const config: OpenSearch.ClientConfig = {
                node: 'http://localhost:9200',
                username: 'user'
            };

            expect(() => formatClientConfig(config, logger)).toThrow(
                'Both "username" and "password" must be provided when one is set'
            );
        });

        it('should throw if only password is provided without username', () => {
            const config: OpenSearch.ClientConfig = {
                node: 'http://localhost:9200',
                password: 'pass'
            };

            expect(() => formatClientConfig(config, logger)).toThrow(
                'Both "username" and "password" must be provided when one is set'
            );
        });

        it('should throw if auth is set alongside username', () => {
            const config: OpenSearch.ClientConfig = {
                node: 'http://localhost:9200',
                auth: { username: 'a', password: 'b' },
                username: 'user'
            };

            expect(() => formatClientConfig(config, logger)).toThrow(
                '"auth" can not be set at the same time as "username" or "password".'
            );
        });

        it('should throw if auth is set alongside password', () => {
            const config: OpenSearch.ClientConfig = {
                node: 'http://localhost:9200',
                auth: { username: 'a', password: 'b' },
                password: 'pass'
            };

            expect(() => formatClientConfig(config, logger)).toThrow(
                '"auth" can not be set at the same time as "username" or "password".'
            );
        });

        it('should create ssl object from caCertificate', () => {
            const config: OpenSearch.ClientConfig = {
                node: 'https://localhost:9200',
                caCertificate: 'my-ca-cert'
            };

            const result = formatClientConfig(config, logger);

            expect(result.ssl).toEqual({ ca: 'my-ca-cert' });
        });

        it('should warn when caCertificate is set but node is not https', () => {
            const warnSpy = jest.spyOn(logger, 'warn');

            const config: OpenSearch.ClientConfig = {
                node: 'http://localhost:9200',
                caCertificate: 'my-ca-cert'
            };

            formatClientConfig(config, logger);

            expect(warnSpy).toHaveBeenCalledWith(
                expect.stringContaining('caCertificate')
            );

            warnSpy.mockRestore();
        });

        it('should warn for non-https nodes in an array', () => {
            const warnSpy = jest.spyOn(logger, 'warn');

            const config: OpenSearch.ClientConfig = {
                node: ['https://localhost:9200', 'http://localhost:9201'],
                caCertificate: 'my-ca-cert'
            };

            formatClientConfig(config, logger);

            expect(warnSpy).toHaveBeenCalledWith(
                expect.stringContaining('not all "nodes" are https')
            );

            warnSpy.mockRestore();
        });

        it('should not warn when all nodes in an array use https', () => {
            const warnSpy = jest.spyOn(logger, 'warn');

            const config: OpenSearch.ClientConfig = {
                node: ['https://localhost:9200', 'https://localhost:9201'],
                caCertificate: 'my-ca-cert'
            };

            formatClientConfig(config, logger);

            expect(warnSpy).not.toHaveBeenCalled();

            warnSpy.mockRestore();
        });

        it('should warn when node is a NodeOptions object without https', () => {
            const warnSpy = jest.spyOn(logger, 'warn');

            const config: OpenSearch.ClientConfig = {
                node: { url: 'http://localhost:9200' },
                caCertificate: 'my-ca-cert'
            };

            formatClientConfig(config, logger);

            expect(warnSpy).toHaveBeenCalledWith(
                expect.stringContaining('node.url')
            );

            warnSpy.mockRestore();
        });
    });
});
