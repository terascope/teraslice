import { ElasticsearchTestHelpers } from '@terascope/opensearch-client';
import { debugLogger } from '@terascope/core-utils';
import opensearch from '@opensearch-project/opensearch';
import API from '../src/index.js';

const logger = debugLogger('retry spec');
const port = '1111';

const { data } = ElasticsearchTestHelpers.EvenDateData;

const body = ElasticsearchTestHelpers.formatUploadData('retry-error-test', data);

type RootCause = Array<{ type: string; reason: string }>;

function makeResponseError(type: string, reason: string, status = 400, rootCause?: RootCause) {
    return {
        statusCode: status,
        body: {
            error: {
                type,
                reason,
                ...(rootCause ? { root_cause: rootCause } : {})
            },
            status
        }
    } as any;
}

describe('retry behavior', () => {
    it('will work with opensearch when connection cannot be established', async () => {
        expect.assertions(4);
        const client = new opensearch.Client({ node: `http://127.0.0.1:${port}` }) as any;
        const { isErrorRetryable } = API(client, logger);

        try {
            await client.bulk({ body });
            throw Error('should have thrown');
        } catch (err) {
            expect(err).toBeDefined();
            expect(isErrorRetryable(err)).toBeTruthy();
        }

        // we try again as we have seen the second call be marked as unretryable
        try {
            await client.bulk({ body });
            throw Error('should have thrown');
        } catch (err) {
            expect(err).toBeDefined();
            expect(isErrorRetryable(err)).toBeTruthy();
        }
    });
});

describe('isErrorRetryable', () => {
    let isErrorRetryable: (err: Error) => boolean;

    beforeAll(() => {
        const client = new opensearch.Client({ node: `http://127.0.0.1:${port}` }) as any;
        ({ isErrorRetryable } = API(client, logger));
    });

    describe('retryable errors', () => {
        it('returns true when err.retryable is true', () => {
            const err = Object.assign(new Error('some error'), { retryable: true });
            expect(isErrorRetryable(err)).toBe(true);
        });

        it('returns true for ECONNREFUSED connection error', () => {
            const err = new Error('connect ECONNREFUSED 127.0.0.1:9200');
            expect(isErrorRetryable(err)).toBe(true);
        });

        it('returns true for No Living connections error', () => {
            const err = new Error('No Living connections');
            expect(isErrorRetryable(err)).toBe(true);
        });

        it('returns true for es_rejected_execution_exception', () => {
            const err = makeResponseError('es_rejected_execution_exception', 'rejected execution of coordinating operation', 429);
            expect(isErrorRetryable(err)).toBe(true);
        });

        it('returns true for rejected_execution_exception', () => {
            const err = makeResponseError('rejected_execution_exception', 'rejected execution of coordinating operation', 429);
            expect(isErrorRetryable(err)).toBe(true);
        });

        it('returns true for circuit_breaking_exception with [parent] reason', () => {
            const err = makeResponseError('circuit_breaking_exception', '[parent] Data too large, data for [<http_request>] would be [1234567890/1.1gb], which is larger than the limit of [1073741824/1gb]', 429);
            expect(isErrorRetryable(err)).toBe(true);
        });

        it('returns true for circuit_breaking_exception with [in_flight_requests] reason', () => {
            const err = makeResponseError('circuit_breaking_exception', '[in_flight_requests] Data too large, data for [<transport_request>] would be [1234567890/1.1gb]', 429);
            expect(isErrorRetryable(err)).toBe(true);
        });

        it('returns true when root_cause contains es_rejected_execution_exception', () => {
            const err = makeResponseError(
                'search_phase_execution_exception',
                'all shards failed',
                429,
                [{ type: 'es_rejected_execution_exception', reason: 'rejected execution of coordinating operation' }]
            );
            expect(isErrorRetryable(err)).toBe(true);
        });

        it('returns true when root_cause contains retryable circuit_breaking_exception', () => {
            const err = makeResponseError(
                'search_phase_execution_exception',
                'all shards failed',
                429,
                [{ type: 'circuit_breaking_exception', reason: '[parent] Data too large' }]
            );
            expect(isErrorRetryable(err)).toBe(true);
        });

        it('returns true when root_cause[i].caused_by contains a retryable error', () => {
            const err = {
                statusCode: 429,
                body: {
                    error: {
                        type: 'search_phase_execution_exception',
                        reason: 'all shards failed',
                        root_cause: [{
                            type: 'some_wrapper_exception',
                            reason: 'wrapper',
                            caused_by: {
                                type: 'es_rejected_execution_exception',
                                reason: 'rejected execution of coordinating operation'
                            }
                        }]
                    },
                    status: 429
                }
            } as any;
            expect(isErrorRetryable(err)).toBe(true);
        });

        it('returns true when root_cause[i].failed_shards[j].reason contains a retryable error', () => {
            const err = {
                statusCode: 429,
                body: {
                    error: {
                        type: 'search_phase_execution_exception',
                        reason: 'all shards failed',
                        root_cause: [{
                            type: 'some_wrapper_exception',
                            reason: 'wrapper',
                            failed_shards: [{
                                shard: 0,
                                index: 'my-index',
                                node: 'node1',
                                reason: {
                                    type: 'es_rejected_execution_exception',
                                    reason: 'rejected execution of coordinating operation'
                                }
                            }]
                        }]
                    },
                    status: 429
                }
            } as any;
            expect(isErrorRetryable(err)).toBe(true);
        });
    });

    describe('non-retryable errors', () => {
        it('returns false for a plain error', () => {
            const err = new Error('some unrelated error');
            expect(isErrorRetryable(err)).toBe(false);
        });

        it('returns false when fatalError is true even if retryable is true', () => {
            const err = Object.assign(new Error('fatal'), { retryable: true, fatalError: true });
            expect(isErrorRetryable(err)).toBe(false);
        });

        it('returns false for circuit_breaking_exception with [fielddata] reason', () => {
            const err = makeResponseError('circuit_breaking_exception', '[fielddata] Data too large, data for [my_field] would be [1234567890/1.1gb]', 429);
            expect(isErrorRetryable(err)).toBe(false);
        });

        it('returns false for circuit_breaking_exception with [accounting] reason', () => {
            const err = makeResponseError('circuit_breaking_exception', '[accounting] Data too large, data for [<segment_reader>] would be [1234567890/1.1gb]', 429);
            expect(isErrorRetryable(err)).toBe(false);
        });

        it('returns false for illegal_argument_exception', () => {
            const err = makeResponseError('illegal_argument_exception', 'Result window is too large, from + size must be less than or equal to: [5] but was [10]', 400);
            expect(isErrorRetryable(err)).toBe(false);
        });

        it('returns false for index_not_found_exception', () => {
            const err = makeResponseError('index_not_found_exception', 'no such index [my-index]', 404);
            expect(isErrorRetryable(err)).toBe(false);
        });

        it('returns false when root_cause only contains non-retryable errors', () => {
            const err = makeResponseError(
                'search_phase_execution_exception',
                'all shards failed',
                400,
                [{ type: 'illegal_argument_exception', reason: 'some argument error' }]
            );
            expect(isErrorRetryable(err)).toBe(false);
        });

        it('returns false for a 404 document-not-found ResponseError (body has no error field)', () => {
            // Real OpenSearch ResponseError when a document is not found:
            // body contains found: false instead of an error object,
            // so isResponseError returns false and the error is non-retryable
            const err = Object.assign(new Error('Response Error'), {
                statusCode: 404,
                body: {
                    _index: 'ts_test',
                    _id: '15598b6369e0913845e1bbfb806cc98f8a8d0ec0',
                    found: false
                },
                meta: {
                    body: {
                        _index: 'ts_test',
                        _id: '15598b6369e0913845e1bbfb806cc98f8a8d0ec0',
                        found: false
                    },
                    statusCode: 404,
                    headers: {
                        'content-type': 'application/json; charset=UTF-8',
                        'content-length': '111'
                    },
                    meta: {
                        context: null,
                        name: 'opensearch-js',
                        attempts: 0,
                        aborted: false
                    }
                }
            });
            expect(isErrorRetryable(err)).toBe(false);
        });
    });

    describe('caused_by and failed_shards on body.error', () => {
        it('returns true when body.error.caused_by contains a retryable error', () => {
            const err = {
                statusCode: 429,
                body: {
                    error: {
                        type: 'search_phase_execution_exception',
                        reason: 'all shards failed',
                        caused_by: {
                            type: 'es_rejected_execution_exception',
                            reason: 'rejected execution of coordinating operation'
                        }
                    },
                    status: 429
                }
            } as any;
            expect(isErrorRetryable(err)).toBe(true);
        });

        it('returns true when body.error.failed_shards[j].reason contains a retryable error', () => {
            const err = {
                statusCode: 429,
                body: {
                    error: {
                        type: 'search_phase_execution_exception',
                        reason: 'all shards failed',
                        failed_shards: [{
                            shard: 0,
                            index: 'my-index',
                            node: 'node1',
                            reason: {
                                type: 'es_rejected_execution_exception',
                                reason: 'rejected execution of coordinating operation'
                            }
                        }]
                    },
                    status: 429
                }
            } as any;
            expect(isErrorRetryable(err)).toBe(true);
        });
    });
});
