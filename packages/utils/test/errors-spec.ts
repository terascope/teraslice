import 'jest-extended';
import { TSError, ElasticsearchError, isFatalError, isRetryableError, parseError, times } from '../src';

describe('Error Utils', () => {
    describe('TSError', () => {
        const testCases = [
            [
                'hello',
                undefined,
                { message: 'hello', statusCode: 500, fatalError: false }
            ],
            [
                'hello',
                {},
                { message: 'hello', statusCode: 500, fatalError: false }
            ],
            [
                'hello',
                { statusCode: 411 },
                { statusCode: 411, fatalError: false }
            ],
            [
                'hello',
                { fatalError: true, statusCode: 502, retryable: true },
                { fatalError: true, statusCode: 502, retryable: true }
            ],
            [
                'hello',
                { reason: 'Failure' },
                { message: 'Failure, caused by hello' }
            ],
            [
                new Error('Uh oh'),
                { reason: 'Failure' },
                { message: 'Failure, caused by Error: Uh oh' }
            ],
            [
                new Error('Oops'),
                { reason: 'Bad news' },
                {
                    message: 'Bad news, caused by Error: Oops',
                    stack: 'TSError: Bad news, caused by Error: Oops'
                }
            ],
            [
                new TSError('Bad Input', {
                    statusCode: 422
                }),
                { reason: 'Failure' },
                {
                    message: 'Failure, caused by TSError: Bad Input',
                    statusCode: 422
                }
            ],
            [
                new TSError('User Input Error', {
                    statusCode: 400
                }),
                { statusCode: 424 },
                {
                    message: 'User Input Error',
                    statusCode: 424
                }
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
                }
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
                }
            ],
            [
                null,
                { reason: 'Failure' },
                { message: 'Failure, caused by Unknown Error' }
            ],
            [
                newESError({
                    body: {
                        error: {
                            type: 'some_es_type',
                            reason: 'some_es_reason',
                            index: 'some_index'
                        }
                    }
                }, {
                    msg: 'Some ES Error',
                    status: 502,
                }),
                { },
                {
                    message: 'Elasticsearch Error: Some ES Error type: some_es_type reason: some_es_reason on index: some_index',
                    statusCode: 502
                }
            ],
            [
                newESError({
                    body: {
                        error: {
                            root_cause: [
                                {
                                    type: 'another_es_type',
                                    reason: 'another_es_reason',
                                    index: 'another_index'
                                }
                            ]
                        }
                    }
                }, {
                    msg: 'Another ES Error',
                }),
                { },
                {
                    message: 'Elasticsearch Error: Another ES Error type: another_es_type reason: another_es_reason on index: another_index',
                }
            ],
            [
                newESError({
                    body: {
                        error: {
                            root_cause: null
                        }
                    }
                }, {
                    msg: 'Invalid ES Error',
                }),
                { reason: 'Failure' },
                {
                    message: 'Failure, caused by Elasticsearch Error: Invalid ES Error',
                }
            ],
            [
                newESError({}, {
                    response: JSON.stringify({
                        _index: 'hello'
                    }),
                    msg: 'Response ES Error',
                }),
                { reason: 'Failure' },
                {
                    message: 'Failure, caused by Elasticsearch Error: Response ES Error on index: hello',
                }
            ],
            [
                newESError({}, {
                    msg: 'document missing',
                    status: 404,
                }),
                { },
                {
                    message: 'Elasticsearch Error: Not Found',
                    statusCode: 404
                }
            ],
            [
                newESError({}, {
                    msg: 'document already exists',
                    status: 409,
                }),
                { },
                {
                    message: 'Elasticsearch Error: Document Already Exists (version conflict)',
                    statusCode: 409
                }
            ],
            [
                newESError({}, {
                    msg: 'unknown error',
                }),
                { statusCode: 502 },
                {
                    message: 'Elasticsearch Error: Unknown Elasticsearch Error, Cluster may be Unavailable',
                    statusCode: 502
                }
            ]
        ];

        describe.each(testCases)('new TSError(%j, %o)', (input, config, expected) => {
            let tsError: TSError;

            beforeAll(() => {
                tsError = new TSError(input, config);
            });

            for (const [key, val] of Object.entries(expected)) {
                if (key === 'stack') {
                    it(`should have ${key} start with "${val}"`, () => {
                        expect(tsError[key]).toStartWith(val as string);
                    });
                } else {
                    it(`should have ${key} set to ${JSON.stringify(val)}`, () => {
                        expect(tsError[key]).toEqual(val);
                    });
                }
            }

            if (expected.fatalError) {
                it('should be a fatalError', () => {
                    expect(isFatalError(tsError)).toBeTrue();
                });
            } else {
                it('should not be a fatalError', () => {
                    expect(isFatalError(tsError)).toBeFalse();
                });
            }

            if (expected.retryable && !expected.fatalError) {
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
});

function newESError(obj: any, metadata: any = {}) {
    const error = new Error() as ElasticsearchError;
    error.name = 'ESError';
    Object.assign(error, obj);
    error.toJSON = () => {
        return metadata;
    };
    return error;
}
