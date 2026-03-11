import 'jest-extended';
import type { ClientParams } from '@terascope/types';
import {
    debugLogger, getFullErrorStack,
    parseError, parseErrorInfo, TSError
} from '@terascope/core-utils';
import {
    createClient, Client,
    ElasticsearchTestHelpers
} from '../src/index.js';

/**
 * NOTE -
 * this is not a client test - it's to test that the
 * core-utils parses opensearch errors correctly -
 * wasn't sure if it should live here or in e2e
 */
describe('core-utils -> errors -> handles opensearch errors', () => {
    const testLogger = debugLogger('search-errs-test');

    const { host } = ElasticsearchTestHelpers.getTestENVClientInfo();
    const config = { node: host };

    let client: Client;

    const createIndex = `search_errs_test_create`;
    const record = {
        hello: 'there',
        num: 28343
    };

    const bodyTypeQuery: ClientParams.CreateParams = {
        index: createIndex,
        refresh: true,
        id: '12341234',
        body: record
    };

    let errRecordExists: any;
    let tsError: any;
    let errNoSuchIndex: any;

    beforeAll(async () => {
        ({ client } = await createClient(config, testLogger));

        await ElasticsearchTestHelpers.cleanupIndex(client, createIndex);
        await client.create(bodyTypeQuery);

        try {
            await client.create(bodyTypeQuery);
        } catch (err) {
            errRecordExists = err;
            tsError = new TSError(err);
        }
        try {
            await client.get({ index: 'foo', id: 'bar' });
        } catch (err: any) {
            errNoSuchIndex = err;
        }
    }, 15000);

    describe('parseError', () => {
        it('should parse a version conflict err', () => {
            const parsed = parseError(errRecordExists);
            expect(parsed).toBe('OpenSearch Error: Document Already Exists (version conflict)');
        });

        it('should parse a no such index error correctly', () => {
            const parsedLessNormalized = parseError(errNoSuchIndex);
            expect(parsedLessNormalized).toBe('OpenSearch Error: Index Not Found: Reason: No Such Index [Foo]');
        });

        it('should parse a TSError version of a search error correctly', () => {
            const parsedTsErr = parseError(tsError);
            expect(parsedTsErr).toBe('OpenSearch Error: Document Already Exists (version conflict)');
        });
    });

    describe('getFullErrorStack', () => {
        it('should get a version conflict error stack correctly', () => {
            const stack = getFullErrorStack(errRecordExists);
            expect(stack).toBe('OpenSearch Error: Document Already Exists (version conflict)');
            expect(stack.split('\n').length).toBe(1);
        });

        it('should get a TSError search error stack correctly', () => {
            const tsStack = getFullErrorStack(tsError);
            expect(tsStack).toStartWith('TSError: OpenSearch Error: Document Already Exists (version conflict)');
            expect(tsStack.split('\n').length).toBeGreaterThan(1);
        });

        it('should get a no such index error stack correctly', () => {
            const stack2 = getFullErrorStack(errNoSuchIndex);
            expect(stack2).toStartWith('OpenSearch Error: Index Not Found: Reason: No Such Index [Foo]');
            expect(stack2.split('\n').length).toBe(1);
        });
    });

    describe('parseErrorInfo', () => {
        it('should get version conflict error info correctly', () => {
            const info = parseErrorInfo(errRecordExists);
            expect(info).toMatchObject({
                message: 'OpenSearch Error: Document Already Exists (version conflict)',
                context: {
                    type: 'version_conflict_engine_exception',
                    reason: '[12341234]: version conflict, document already exists (current version [1])',
                    index: 'search_errs_test_create',
                    shard: '0'
                },
                statusCode: 409,
                code: 'RESPONSE_ERROR_12341234_VERSION_CONFLICT_DOCUMENT_ALREADY_EXISTS_CURRENT_VERSION_1'
            });
        });

        it('should get TSError search error info correctly', () => {
            const info = parseErrorInfo(tsError);
            expect(info).toMatchObject({
                message: 'OpenSearch Error: Document Already Exists (version conflict)',
                context: {
                    shard: expect.any(String),
                    type: 'version_conflict_engine_exception',
                    reason: '[12341234]: version conflict, document already exists (current version [1])',
                    index: 'search_errs_test_create'
                },
                statusCode: 409,
                code: 'RESPONSE_ERROR_12341234_VERSION_CONFLICT_DOCUMENT_ALREADY_EXISTS_CURRENT_VERSION_1'
            });
        });

        it('should get no such index error info correctly', () => {
            const info = parseErrorInfo(errNoSuchIndex);
            expect(info).toMatchObject({
                message: 'OpenSearch Error: Index Not Found: Reason: No Such Index [Foo]',
                context: {
                    type: 'index_not_found_exception',
                    reason: 'no such index [foo]',
                    index: 'foo'
                },
                statusCode: 404,
                code: 'RESPONSE_ERROR_NO_SUCH_INDEX_FOO'
            });
        });
    });
});
