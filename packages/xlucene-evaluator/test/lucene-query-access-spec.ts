import 'jest-extended';
import { SearchParams } from 'elasticsearch';
import { TSError } from '@terascope/utils';
import { LuceneQueryAccess } from '../src';

describe('LuceneQueryAccess', () => {
    describe('when constructed without exclude', () => {
        it('should set an empty array', () => {
            const queryAccess = new LuceneQueryAccess({});

            expect(queryAccess.excludes).toBeArrayOfSize(0);
        });
    });

    describe('when constructed with exclusive fields', () => {
        const queryAccess = new LuceneQueryAccess({
            excludes: [
                'bar',
                'moo',
                'baa.maa',
                'a.b',
            ]
        });

        describe('when passed queries with foo in field', () => {
            it('should return the input query', () => {
                const query = 'foo:example';

                const result = queryAccess.restrict(query);
                expect(result).toEqual(query);
            });
        });

        describe('when passed queries with bar in field', () => {
            it('should throw when input query is restricted', () => {
                expect.hasAssertions();

                const query = 'bar:example';

                try {
                    queryAccess.restrict(query);
                } catch (err) {
                    expect(err).toBeInstanceOf(TSError);
                    expect(err.statusCode).toEqual(403);
                    expect(err.message).toEqual('Field bar in query is restricted');
                }
            });

            it('should throw when input query is restricted with nested fields', () => {
                const query = 'bar.hello:example';

                expect(() => queryAccess.restrict(query))
                    .toThrowError('Field bar.hello in query is restricted');
            });
        });

        describe('when passed queries with moo in field', () => {
            it('should throw when input query is restricted', () => {
                const query = 'moo:example';

                expect(() => queryAccess.restrict(query))
                    .toThrowError('Field moo in query is restricted');
            });
        });

        describe('when passed queries with a nested baa.maa field', () => {
            it('should throw when input query is restricted', () => {
                const query = 'baa.maa:example';

                expect(() => queryAccess.restrict(query))
                    .toThrowError('Field baa.maa in query is restricted');
            });
        });

        describe('when passed queries with baa.chaa field', () => {
            it('should return the input query', () => {
                const query = 'baa.chaa:example';

                const result = queryAccess.restrict(query);
                expect(result).toEqual(query);
            });
        });

        describe('when passed queries with a nested a.b.c field', () => {
            it('should throw when input query is restricted', () => {
                const query = 'a.b.c:example';

                expect(() => queryAccess.restrict(query))
                    .toThrowError('Field a.b.c in query is restricted');
            });
        });

        describe('when passed queries with a.c.b field', () => {
            it('should return the input query', () => {
                const query = 'a.c.b:example';

                const result = queryAccess.restrict(query);
                expect(result).toEqual(query);
            });
        });
    });

    describe('when constructed with include fields', () => {
        const queryAccess = new LuceneQueryAccess({
            includes: [
                'bar',
                'star'
            ]
        });

        it('should throw if field is not included', () => {
            expect.hasAssertions();

            const query = 'hello:world';

            try {
                queryAccess.restrict(query);
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.statusCode).toEqual(403);
                expect(err.message).toEqual('Field hello in query is restricted');
            }
        });

        it('should throw if field implicit', () => {
            expect.hasAssertions();

            const query = 'hello';

            expect(() => queryAccess.restrict(query)).toThrowError('Implicit fields are restricted, please specify the field');
        });

        it('should throw when using *', () => {
            expect.hasAssertions();

            const query = '*';

            expect(() => queryAccess.restrict(query)).toThrowError('Implicit fields are restricted, please specify the field');
        });

        it('should not throw if field implicit are allowed', () => {
            expect.hasAssertions();

            const query = '*';

            const result = new LuceneQueryAccess({
                allow_implicit_queries: true
            }).restrict(query);

            expect(result).toEqual(query);
        });

        it('should throw if field is not included', () => {
            const query = 'hello:world AND bar:foo';

            expect(() => queryAccess.restrict(query)).toThrow();
        });

        it('should throw if passed an empty query', () => {
            const query = '';

            expect(() => queryAccess.restrict(query))
                .toThrowWithMessage(TSError, 'Empty queries are restricted');
        });

        it('should allow field listed if included', () => {
            const query = 'bar:foo';

            expect(queryAccess.restrict(query)).toEqual(query);
        });

        it('should allow field listed if included', () => {
            const query = 'bar:[0 TO *] OR star:(0 OR 2)';

            expect(queryAccess.restrict(query)).toEqual(query);
        });

        it('should be able to convert an empty query to a wildcard', () => {
            const query = '';

            const result = new LuceneQueryAccess({
                convert_empty_query_to_wildcard: true
            }).restrict(query);
            expect(result).toEqual('*');
        });
    });

    describe('when using a constraint that is not restricted', () => {
        const constraint = 'foo:bar';
        const queryAccess = new LuceneQueryAccess({
            constraint,
        });

        it('should append the constraint on the returned query', () => {
            const query = 'hello:world';
            expect(queryAccess.restrict(query))
                .toEqual(`${query} AND ${constraint}`);
        });
    });

    describe('when using a constraint that is restricted', () => {
        const constraint = 'hello:world';
        const queryAccess = new LuceneQueryAccess({
            constraint,
            excludes: [
                'hello'
            ]
        });

        it('should return the query', () => {
            const query = 'foo:bar';

            expect(queryAccess.restrict(query))
                .toEqual(`${query} AND ${constraint}`);
        });
    });

    describe('when resticting prefix wildcards', () => {
        const queryAccess = new LuceneQueryAccess({
            prevent_prefix_wildcard: true,
        });

        describe.each([
            ['hello:*world'],
            ['hello:?world'],
            ['hello:" *world"'],
        ])('when using a query of "%s"', (query) => {
            it('should throw an error', () => {
                expect(() => queryAccess.restrict(query))
                    .toThrowWithMessage(TSError, 'Wildcard queries of the form \'fieldname:*value\' or \'fieldname:?value\' in query are restricted');
            });
        });

        it('should work range queries', () => {
            const query = 'hello:world AND bytes:{2000 TO *]';

            expect(queryAccess.restrict(query)).toEqual(query);
        });
    });

    describe('when converting to an elasticsearch search query', () => {
        const queryAccess = new LuceneQueryAccess({
            convert_empty_query_to_wildcard: true,
            excludes: [
                'bar',
                'baz'
            ],
            includes: [
                'foo',
                'moo'
            ],
        });

        it('should be able to return a restricted query', () => {
            const params: SearchParams = {
                q: 'idk',
                _sourceInclude: [
                    'moo'
                ],
                _sourceExclude: [
                    'baz'
                ]
            };

            const result = queryAccess.restrictSearchQuery('foo:bar', params);
            expect(result).toMatchObject({
                _sourceExclude: [
                    'baz'
                ],
                _sourceInclude: [
                    'moo'
                ],
            });

            expect(params).toHaveProperty('q', 'idk');
            expect(result).not.toHaveProperty('q', 'idk');
        });

        it('should be able to allow empty queries when convert_empty_query_to_wildcard is set to true', () => {
            const result = queryAccess.restrictSearchQuery('');
            expect(result).toEqual({
                body: {
                    query: {
                        constant_score: {
                            filter: {
                                bool: {
                                    filter: [],
                                    must_not: [],
                                    should: [],
                                },
                            },
                        },
                    },
                },
                _sourceExclude: [
                    'bar',
                    'baz'
                ],
                _sourceInclude: [
                    'foo',
                    'moo'
                ],
            });
        });

        it('should be able to return a restricted query without any params', () => {
            const result = queryAccess.restrictSearchQuery('foo:bar');
            expect(result).toMatchObject({
                _sourceExclude: [
                    'bar',
                    'baz'
                ],
                _sourceInclude: [
                    'foo',
                    'moo'
                ],
            });

            expect(result).not.toHaveProperty('q', 'idk');
        });
    });
});
