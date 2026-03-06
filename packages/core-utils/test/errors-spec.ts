import 'jest-extended';
import {
    TSError, isFatalError, isRetryableError, isTSError,
    formatAggregateError, parseError, stripErrorMessage
} from '../src/errors.js';
import { times } from '../src/index.js';

import type { EstimatedElasticOpenSearchError, SearchErrorMetadata } from '../src/errors';

class TestOpenSearchClientError extends Error implements EstimatedElasticOpenSearchError {
    meta?: SearchErrorMetadata;

    constructor(
        err: Partial<Error>,
        meta?: SearchErrorMetadata
    ) {
        super();
        Object.assign(this, err);
        this.meta = meta;

        // rename constructor prototype name
        Object.defineProperty(
            TestOpenSearchClientError,
            'name',
            // real err would work w/ElasticsearchClientError too
            { value: 'OpenSearchClientError' }
        );
    }
}

describe('Error Utils', () => {
    describe('TSError', () => {
        const testCases: [any, any, Record<string, unknown>][] = [
            ['hello', undefined, { message: 'hello', statusCode: 500, fatalError: false }],
            ['hello',
                {},
                {
                    message: 'hello', statusCode: 500, fatalError: false, code: 'INTERNAL_SERVER_ERROR'
                }],
            ['hello', { statusCode: 411 }, { statusCode: 411, fatalError: false, code: 'LENGTH_REQUIRED' }],
            ['hello', { fatalError: true, statusCode: 502, retryable: true }, { fatalError: true, statusCode: 502, retryable: undefined }],
            ['hello', { fatalError: false, statusCode: 504, retryable: true }, { fatalError: false, statusCode: 504, retryable: true }],
            ['hello', { reason: 'Failure' }, { message: 'Failure, caused by hello' }],
            [new Error('Uh oh'), { reason: 'Failure' }, { message: 'Failure, caused by Error: Uh oh' }],
            [
                new Error('Oops'),
                { reason: 'Bad news' },
                {
                    message: 'Bad news, caused by Error: Oops',
                    stack: 'TSError: Bad news, caused by Error: Oops',
                },
            ],
            [
                new TSError('Fatal Error', {
                    fatalError: true,
                    code: 'EXAMPLE',
                }),
                {},
                {
                    code: 'EXAMPLE',
                    fatalError: true,
                    message: 'Fatal Error',
                },
            ],
            [
                new TSError('Bad Input', {
                    statusCode: 422,
                }),
                { reason: 'Failure' },
                {
                    message: 'Failure, caused by TSError: Bad Input',
                    statusCode: 422,
                },
            ],
            [
                new TSError('User Input Error', {
                    statusCode: 400,
                }),
                { statusCode: 424 },
                {
                    message: 'User Input Error',
                    statusCode: 424,
                },
            ],
            [
                new TSError('Locked', {
                    statusCode: 423,
                }),
                { retryable: true },
                {
                    message: 'Locked',
                    statusCode: 423,
                    retryable: true,
                },
            ],
            [
                new TSError('Rate Limit', {
                    statusCode: 429,
                }),
                { retryable: false },
                {
                    message: 'Rate Limit',
                    statusCode: 429,
                    retryable: false,
                },
            ],
            [
                new TSError('I\'m a teapot', {
                    context: {
                        iamteapot: true,
                    },
                    statusCode: 418,
                }),
                { reason: 'IDK' },
                {
                    message: 'IDK, caused by TSError: I\'m a teapot',
                    statusCode: 418,
                    context: {
                        iamteapot: true,
                    },
                },
            ],
            [null, { reason: 'Failure' }, { message: 'Failure, caused by Unknown Error' }],
            [
                new TestOpenSearchClientError(
                    {
                        message: 'Some OS Error',
                        name: 'OpenSearchClientError'
                    },
                    {
                        body: {
                            error: {
                                type: 'some_os_type',
                                root_cause: [
                                    {
                                        reason: 'some_os_reason',
                                        type: 'some_os_type'
                                    }
                                ],
                                index: 'some_index',
                            },
                        },
                        statusCode: 502
                    }
                ),
                {},
                {
                    message: 'OpenSearch Error: Some OS Error',
                    statusCode: 502,
                },
            ],
            [
                new TestOpenSearchClientError(
                    {
                        message: 'Another OS Error',
                        name: 'OpenSearchClientError'
                    },
                    {
                        body: {
                            error: {
                                root_cause: [
                                    {
                                        type: 'another_os_type',
                                        reason: 'another_os_reason',
                                        index: 'another_index',
                                    },
                                ],
                            },
                        },
                    }
                ),
                {},
                {
                    message: 'OpenSearch Error: Another OS Error',
                },
            ],
            [
                new TestOpenSearchClientError(
                    {
                        message: 'Invalid OS Error',
                    },
                    {
                        body: { error: {} },
                    }
                ),
                { reason: 'Failure' },
                {
                    message: 'Failure, caused by OpenSearch Error: Invalid OS Error',
                },
            ],
            [
                new TestOpenSearchClientError(
                    { message: 'document missing' },
                    { body: { status: 404 } }
                ),
                {},
                {
                    message: 'OpenSearch Error: Not Found',
                    statusCode: 404,
                },
            ],
            [
                new TestOpenSearchClientError(
                    { message: 'document already exists' },
                    { statusCode: 409 }
                ),
                {},
                {
                    message: 'OpenSearch Error: Document Already Exists (version conflict)',
                    statusCode: 409,
                },
            ],
            [
                new TestOpenSearchClientError(
                    { message: 'unknown error' },
                    {}
                ),
                { statusCode: 502 },
                {
                    message: 'OpenSearch Error: Unknown OpenSearch Error, Cluster may be Unavailable',
                    statusCode: 502,
                },
            ],
        ];

        describe.each(testCases)('new TSError(%j, %o)', (input, config, expected) => {
            const tsError: TSError = new TSError(input, config as any);

            for (const [key, val] of Object.entries(expected)) {
                if (key === 'stack') {
                    it(`should have "${key}" start with "${val}"`, () => {
                        expect(tsError[key]).toStartWith(val as string);
                    });
                } else if (key === 'context') {
                    it(`should have "${key}" match ${JSON.stringify(val)}`, () => {
                        expect(tsError[key]).toMatchObject(val as Record<string, unknown>);
                    });
                } else {
                    it(`should have "${key}" set to ${JSON.stringify(val)}`, () => {
                        expect(tsError[key as keyof TSError]).toEqual(val);
                    });
                }
            }

            it('should have the default context properties', () => {
                if (input && !isTSError(input)) {
                    expect(tsError.context._cause).toEqual(input);
                }
                expect(tsError.context).toHaveProperty('_createdAt');
            });

            it('should be able to return the cause', () => {
                expect(tsError.getCause()).toEqual(tsError.context._cause);
            });

            if (expected.fatalError) {
                it('should be a fatalError', () => {
                    expect(isFatalError(tsError)).toBeTrue();
                });
            } else {
                it('should not be a fatalError', () => {
                    expect(isFatalError(tsError)).toBeFalse();
                });
            }

            if (expected && expected.retryable && !expected.fatalError) {
                it('should be retryable', () => {
                    expect(isRetryableError(tsError)).toBeTrue();
                });
            } else {
                it('should not be retryable', () => {
                    expect(isRetryableError(tsError)).toBeFalse();
                });
            }
        });
    });

    describe('when stripping an error message', () => {
        it('should be able to work with a chained error', () => {
            const err = new TSError('Uh oh');
            const error = new TSError(err, {
                reason: 'Failure',
            });
            expect(stripErrorMessage(error, 'Bad news')).toEqual('Bad news: Failure');
        });

        describe('when requireSafe=true', () => {
            it('should be able to work', () => {
                const error = new TSError('darn', {
                    reason: 'Failure',
                });
                expect(stripErrorMessage(error, 'Bad news', true)).toEqual('Bad news');
            });

            it('should be able to work with a chained error', () => {
                const err = new TSError('Uh oh');
                const error = new TSError(err, {
                    reason: 'Failure',
                });
                expect(stripErrorMessage(error, 'Bad news', true)).toEqual('Bad news');
            });

            it('should work with a forbidden error', () => {
                const error = new TSError('Some Forbidden Message', {
                    statusCode: 403,
                });
                expect(stripErrorMessage(error, 'Bad news', true)).toEqual('Access Denied');
            });

            it('should work with a 404 error', () => {
                const error = new TSError('Some Forbidden Message', {
                    statusCode: 404,
                });
                expect(stripErrorMessage(error, 'Bad news', true)).toEqual('Not Found');
            });

            it('should be able to work with context.safe', () => {
                const error = new TSError('Uh oh', {
                    context: {
                        safe: true,
                    },
                });
                expect(stripErrorMessage(error, 'Bad news', true)).toEqual('Uh oh');
            });

            it('should NOT keep the context.safe from a chained error', () => {
                const err = new TSError('Uh oh', {
                    context: {
                        safe: true,
                    },
                });
                const error = new TSError(err);
                expect(stripErrorMessage(error, 'Bad news', true)).toEqual('Bad news');
            });
        });
    });

    describe('when parsing an error', () => {
        describe('when it is too long', () => {
            it('should truncate it', () => {
                const input = times(4000, () => 'a').join('');
                const output = times(3000 - 4, () => 'a').join('');

                expect(parseError(input)).toEqual(`${output} ...`);
            });
        });

        describe('when passed an error', () => {
            const err = new Error('Parse Error Test');

            it('should return the stack if requested', () => {
                expect(parseError(err, true)).toEqual(err.stack);
            });

            it('should not return the stack', () => {
                expect(parseError(err)).toEqual(err.message);
            });
        });

        describe('when pass an object', () => {
            it('should json stringify it', () => {
                const input = { hello: true };
                const output = JSON.stringify(input);

                expect(parseError(input)).toEqual(output);
            });
        });
    });

    describe('formatAggregateError', () => {
        it('should format a mix of Error and non-Error objects', async () => {
            const aggregate = new AggregateError([
                new Error('Failed on 1'),
                { error: '3 failed and returned a non Error type object' }
            ]);

            await expect(formatAggregateError(aggregate)).rejects.toThrow(
                'Failed with an AggregateError containing 2 error(s):\n\n'
                + '[1] Failed on 1\n'
                + '[2] {"error":"3 failed and returned a non Error type object"}'
            );
        });

        it('should show a maximum of 5 errors', async () => {
            const errors = [];
            for (let i = 2; i <= 7; i++) {
                errors.push(new Error(`Error on ${i}`));
            }
            const aggregate = new AggregateError(errors);

            await expect(formatAggregateError(aggregate)).rejects.toThrow(
                'Failed with an AggregateError containing 6 error(s):\n\n'
                + '[1] Error on 2\n'
                + '[2] Error on 3\n'
                + '[3] Error on 4\n'
                + '[4] Error on 5\n'
                + '[5] Error on 6\n'
                + '... and 1 other errors.'
            );
        });

        it('should pass through non-AggregateError as-is', async () => {
            const notAnAggregate = new Error('Just a normal error');
            await expect(formatAggregateError(notAnAggregate)).rejects.toThrow('Just a normal error');
        });
    });
});
