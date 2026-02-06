import 'jest-extended';
import { xLuceneFieldType, ClientParams } from '@terascope/types';
import { TSError } from '@terascope/core-utils';
import { QueryAccess } from '../src/index.js';

describe('QueryAccess', () => {
    describe('when constructed without type_config', () => {
        it('should throw an error', () => {
            expect(() => new QueryAccess({})).toThrow('type_config must be provided');
        });
    });

    describe('when constructed without exclude', () => {
        it('should set an empty array', () => {
            const queryAccess = new QueryAccess(
                { type_config: { foo: xLuceneFieldType.String } },
            );

            expect(queryAccess.excludes).toBeArrayOfSize(0);
        });
    });

    describe('when constructed with exclusive fields', () => {
        const queryAccess = new QueryAccess({
            excludes: ['bar', 'moo', 'baa.maa', 'a.b'],
            type_config: {
                foo: xLuceneFieldType.String,
                bar: xLuceneFieldType.String,
                moo: xLuceneFieldType.String,
                baa: xLuceneFieldType.Object,
                'baa.maa': xLuceneFieldType.String,
                'baa.chaa': xLuceneFieldType.String,
                a: xLuceneFieldType.Object,
                'a.b': xLuceneFieldType.Object,
                'a.b.c': xLuceneFieldType.String,
                'a.c': xLuceneFieldType.Object,
                'a.c.b': xLuceneFieldType.String,
                mood: xLuceneFieldType.String
            }
        });

        describe('when passed queries with foo in field', () => {
            it('should return the input query', () => {
                const query = 'foo:example';

                const result = queryAccess.restrict(query);
                expect(result).toEqual(query);
            });
        });

        describe('when passed a query which prefix matches excluded field', () => {
            it('should not throw', () => {
                const query = 'mood:example';
                const result = queryAccess.restrict(query);

                expect(result).toEqual(query);
            });

            it('can restrict types', () => {
                const expected = {
                    baa: xLuceneFieldType.Object,
                    a: xLuceneFieldType.Object,
                    foo: xLuceneFieldType.String,
                    mood: xLuceneFieldType.String,
                    'baa.chaa': xLuceneFieldType.String,
                    'a.c': xLuceneFieldType.Object,
                    'a.c.b': xLuceneFieldType.String,
                };
                expect(queryAccess.parsedTypeConfig).toEqual(expected);
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

                expect(() => queryAccess.restrict(query)).toThrow('Field bar.hello in query is restricted');
            });
        });

        describe('when passed queries with moo in field', () => {
            it('should throw when input query is restricted', () => {
                const query = 'moo:example';

                expect(() => queryAccess.restrict(query)).toThrow('Field moo in query is restricted');
            });
        });

        describe('when passed queries with a nested baa.maa field', () => {
            it('should throw when input query is restricted', () => {
                const query = 'baa.maa:example';

                expect(() => queryAccess.restrict(query)).toThrow('Field baa.maa in query is restricted');
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

                expect(() => queryAccess.restrict(query)).toThrow('Field a.b.c in query is restricted');
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
        const queryAccess = new QueryAccess({
            includes: ['bar', 'star', 'baz'],
            type_config: {
                bar: xLuceneFieldType.Integer,
                star: xLuceneFieldType.Integer,
                baz: xLuceneFieldType.String
            }
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

            expect(() => queryAccess.restrict(query)).toThrow('Implicit fields are restricted, please specify the field');
        });

        it('should not throw if given baz.text', () => {
            expect.hasAssertions();
            const query = 'baz.text:foo';

            expect(() => queryAccess.restrict(query)).not.toThrow();
        });

        it('should throw when using *', () => {
            expect.hasAssertions();

            const query = '*';

            expect(() => queryAccess.restrict(query)).toThrow('Implicit fields are restricted, please specify the field');
        });

        it('should not throw if field implicit are allowed', () => {
            expect.hasAssertions();

            const query = '*';

            const result = new QueryAccess({
                allow_implicit_queries: true,
                type_config: {
                    bar: xLuceneFieldType.String,
                }
            }).restrict(query);

            expect(result).toEqual(query);
        });

        it('should throw if field is not included with other term', () => {
            const query = 'hello:world AND bar:12';

            expect(() => queryAccess.restrict(query)).toThrow();
        });

        it('should throw if passed an empty query', () => {
            expect(() => new QueryAccess({
                allow_empty_queries: false,
                type_config: {
                    bar: xLuceneFieldType.String,
                }
            }).restrict('')).toThrowWithMessage(TSError, 'Empty queries are restricted');
        });

        it('should return an empty query when allowed', () => {
            expect(
                new QueryAccess({
                    allow_empty_queries: true,
                    type_config: {
                        bar: xLuceneFieldType.String,
                    }
                }).restrict('')
            ).toEqual('');
        });

        it('should return constraint if given an empty query', () => {
            expect(
                new QueryAccess({
                    allow_empty_queries: true,
                    constraint: 'foo:bar',
                    type_config: {
                        foo: xLuceneFieldType.String,
                        bar: xLuceneFieldType.Integer,
                        star: xLuceneFieldType.Integer
                    }
                }).restrict('')
            ).toEqual('foo:bar');
        });

        it('should allow field listed if included', () => {
            const query = 'bar:12';

            expect(queryAccess.restrict(query)).toEqual(query);
        });

        it('should allow field listed if included with range query', () => {
            const query = 'bar:[0 TO *] OR star:(0 OR 2)';

            expect(queryAccess.restrict(query)).toEqual(query);
        });

        describe('when given an empty query', () => {
            it('should be able to default to constraint query', () => {
                const result = new QueryAccess({
                    constraint: 'foo:bar',
                    type_config: {
                        foo: xLuceneFieldType.String,
                    }
                }).restrict('');
                expect(result).toEqual('foo:bar');
            });
        });

        describe('when given null', () => {
            it('should be able to default to constraint query', () => {
                // @ts-expect-error
                const query: string = null;

                const result = new QueryAccess({
                    constraint: 'foo:bar',
                    type_config: {
                        foo: xLuceneFieldType.String,
                    }
                }).restrict(query);
                expect(result).toEqual('foo:bar');
            });
        });

        describe('when given undefined', () => {
            it('should be able to default to constraint query', () => {
                // @ts-expect-error
                const query: string = undefined;

                const result = new QueryAccess({
                    constraint: 'foo:bar',
                    type_config: {
                        foo: xLuceneFieldType.String,
                    }
                }).restrict(query);
                expect(result).toEqual('foo:bar');
            });
        });
    });

    describe('when using a field wildcard', () => {
        it('should not throw if includes matches field wildcard', () => {
            const queryAccess = new QueryAccess({
                includes: ['field_one', 'field_two'],
                type_config: {
                    field_one: xLuceneFieldType.String,
                    field_two: xLuceneFieldType.String,
                }
            });

            const query = 'field_*:bar';
            expect(() => queryAccess.restrict(query)).not.toThrow();
        });

        it('should throw if includes does not match all fields', () => {
            const queryAccess = new QueryAccess({
                includes: ['field_one', 'field_two'],
                type_config: {
                    field_one: xLuceneFieldType.String,
                    field_two: xLuceneFieldType.String,
                    foo: xLuceneFieldType.String
                }
            });

            const query = 'field_*:bar AND foo:bar';
            expect(() => queryAccess.restrict(query)).toThrow();
        });

        it('should not throw if type_config field has valid matching fields', () => {
            const queryAccess = new QueryAccess({
                includes: ['field_one'],
                type_config: {
                    field_one: xLuceneFieldType.String,
                    field_two: xLuceneFieldType.String,
                }
            });

            const query = 'field_*:bar';
            expect(() => queryAccess.restrict(query)).not.toThrow();
        });

        it('should throw if excludes matches all fields wildcard query', () => {
            const queryAccess = new QueryAccess({
                excludes: ['field_one', 'field_two'],
                type_config: {
                    field_one: xLuceneFieldType.String,
                    field_two: xLuceneFieldType.String,
                }
            });

            const query = 'field_*:bar';
            expect(() => queryAccess.restrict(query)).toThrow();
        });

        it('should not throw if field wildcard query is not restricted on all variants', () => {
            const queryAccess = new QueryAccess({
                excludes: ['field_two'],
                type_config: {
                    field_one: xLuceneFieldType.String,
                    field_two: xLuceneFieldType.String,
                }
            });

            const query = 'field_*:bar';
            expect(queryAccess.restrict(query)).toEqual(query);
        });

        it('should throw if excludes contains all variants for field wildcard query', () => {
            const queryAccess = new QueryAccess({
                excludes: ['field_one', 'field_two'],
                type_config: {
                    field_one: xLuceneFieldType.String,
                    field_two: xLuceneFieldType.String,
                }
            });

            const query = 'field_*:bar';
            expect(() => queryAccess.restrict(query)).toThrow();
        });

        it('should not throw if includes matches first path', () => {
            const queryAccess = new QueryAccess({
                includes: ['foo'],
                type_config: {
                    foo: xLuceneFieldType.Object,
                    'foo.a': xLuceneFieldType.String
                }
            });

            const query = 'foo.*:bar';
            expect(() => queryAccess.restrict(query)).not.toThrow();
        });

        it('should throw if excludes matches first path', () => {
            const queryAccess = new QueryAccess({
                excludes: ['foo.bar'],
                type_config: {
                    foo: xLuceneFieldType.Object,
                    'foo.bar': xLuceneFieldType.String,
                    'foo.baz': xLuceneFieldType.String,
                }
            });

            const query = 'foo.*:bar';
            expect(() => queryAccess.restrict(query)).not.toThrow();
        });

        it('should throw if it matches prefix in includes', () => {
            const queryAccess = new QueryAccess({
                includes: ['field_'],
                type_config: {
                    field_one: xLuceneFieldType.String,
                    field_two: xLuceneFieldType.String,
                }
            });

            const query = 'field_*:bar';
            expect(() => queryAccess.restrict(query)).toThrow();
        });

        it('should throw if it matches prefix in excludes', () => {
            const queryAccess = new QueryAccess({
                excludes: ['field'],
                type_config: {
                    field_one: xLuceneFieldType.String,
                    field_two: xLuceneFieldType.String,
                }
            });

            const query = 'field_*:bar';
            expect(() => queryAccess.restrict(query)).not.toThrow();
        });
    });

    describe('when using a constraint that is not restricted', () => {
        const constraint = 'foo:bar';
        const queryAccess = new QueryAccess({
            constraint,
            type_config: {
                foo: xLuceneFieldType.String,
                hello: xLuceneFieldType.String
            }
        });

        it('should append the constraint on the returned query', () => {
            const query = 'hello:world';
            expect(queryAccess.restrict(query)).toEqual(`(${constraint}) AND (${query})`);
        });
    });

    describe('when using a constraint that is restricted', () => {
        const constraint = 'hello:world';
        const queryAccess = new QueryAccess({
            constraint,
            excludes: ['hello'],
            type_config: {
                foo: xLuceneFieldType.String,
                hello: xLuceneFieldType.String,
            }
        });

        it('should return the query', () => {
            const query = 'foo:bar';

            expect(queryAccess.restrict(query)).toEqual(`(${constraint}) AND (${query})`);
        });
    });

    describe('when restricting prefix wildcards', () => {
        const queryAccess = new QueryAccess({
            prevent_prefix_wildcard: true,
            type_config: {
                bar: xLuceneFieldType.String,
                hello: xLuceneFieldType.String,
                bytes: xLuceneFieldType.Integer
            }
        });

        describe.each([['hello:*world'], ['hello:?world']])('when using a query of "%s"', (query) => {
            it('should throw an error', () => {
                expect(() => queryAccess.restrict(query)).toThrowWithMessage(
                    TSError,
                    'Queries starting with wildcards in the form \'fieldname:*value\' or \'fieldname:?value\' are restricted'
                );
            });
        });

        describe.each([['hello:/*world/'], ['hello:/.*world/'], ['hello:/.+world/']])('when using a query of "%s"', (query) => {
            it('should throw an error', () => {
                expect(() => queryAccess.restrict(query)).toThrowWithMessage(
                    TSError,
                    'Regular expression queries starting with wildcards in the form \'fieldname:/.*value/\' or \'fieldname:/.?value/\' are restricted'
                );
            });
        });

        describe.each([['hello:/w*/'], ['hello:/w{0,1}/']])('when using a query of "%s"', (query) => {
            it('should throw an error', () => {
                expect(() => queryAccess.restrict(query)).toThrowWithMessage(
                    TSError,
                    'Regular expression queries with non-guaranteed matches in the form \'fieldname:/v*/\' or \'fieldname:/v{0,1}/\' are restricted'
                );
            });
        });

        it('should work range queries', () => {
            const query = 'hello:world AND bytes:{2000 TO *]';

            expect(queryAccess.restrict(query)).toEqual(query);
        });
    });

    describe('when there is no field restrictions', () => {
        it('should be able to limit the source fields via params', async () => {
            const params: ClientParams.SearchParams = {
                _source_includes: ['foo'],
                _source_excludes: ['bar'],
            };

            const qa = new QueryAccess({
                excludes: [],
                includes: [],
                type_config: {
                    foo: xLuceneFieldType.String,
                    bar: xLuceneFieldType.String,
                }
            });
            const result = await qa.restrictSearchQuery('foo:bar', {
                params
            });

            expect(result).toMatchObject({
                _source_includes: ['foo'],
                _source_excludes: ['bar'],
            });
        });
    });

    describe('when converting to an opensearch search query', () => {
        const queryAccessExcludes = ['bar', 'baz'];
        const queryAccessIncludes = ['foo', 'moo'];
        const queryAccess = new QueryAccess({
            allow_implicit_queries: true,
            default_geo_field: 'moo',
            default_geo_sort_order: 'desc',
            default_geo_sort_unit: 'mm',
            excludes: queryAccessExcludes,
            includes: queryAccessIncludes,
            type_config: {
                moo: xLuceneFieldType.GeoPoint,
                bar: xLuceneFieldType.String,
                baz: xLuceneFieldType.String,
                foo: xLuceneFieldType.String,
            }
        });

        it('should be able to return a restricted query', async () => {
            const params: ClientParams.SearchParams = {
                q: 'idk',
                _source_includes: ['moo'],
                _source_excludes: ['baz'],
            };

            const result = await queryAccess.restrictSearchQuery('foo:bar', {
                params
            });
            expect(result).toMatchObject({
                _source_includes: ['moo'],
                _source_excludes: queryAccessExcludes,
            });
            expect(result).not.toHaveProperty('q', 'idk');

            expect(params._source_includes).toBe(params._source_includes);
            expect(params._source_excludes).toBe(params._source_excludes);

            expect(params).toMatchObject({
                _source_includes: ['moo'],
                _source_excludes: ['baz'],
            });

            expect(params).toHaveProperty('q', 'idk');
        });

        it('should respect original query access excluded fields when excluding more', async () => {
            const params: ClientParams.SearchParams = {
                q: 'idk',
                _source_excludes: ['foo'],
            };

            const result = await queryAccess.restrictSearchQuery('foo:bar', { params });

            expect(result).toMatchObject({
                _source_includes: queryAccessIncludes,
                _source_excludes: ['bar', 'baz', 'foo'], // original restrictions + params
            });
        });

        it('should NOT include fields not permitted by original query access included fields', async () => {
            const params: ClientParams.SearchParams = {
                q: 'idk',
                _source_includes: ['baz', 'foo'],
            };

            const result = await queryAccess.restrictSearchQuery('foo:bar', { params });

            expect(result).toMatchObject({
                _source_includes: ['foo'], // baz not allowed per original restrictions but foo is
                _source_excludes: queryAccessExcludes
            });
        });

        it('should exclude all fields if none of requested included fields are permitted by original query access included fields so user doesn\'t see restricted and/or non requested fields', async () => {
            const params: ClientParams.SearchParams = {
                q: 'idk',
                _source_includes: ['baz'], // not allowed per original restrictions
            };

            const result = await queryAccess.restrictSearchQuery('foo:bar', { params });

            expect(result).toMatchObject({
                _source_includes: [], // baz not allowed per original restrictions so exclude all
                _source_excludes: ['*'], // '*' excludes all
            });
        });

        it('should be able to allow * queries', async () => {
            const result = await queryAccess.restrictSearchQuery('*');
            expect(result).toEqual({
                body: {
                    query: {
                        constant_score: {
                            filter: {
                                bool: {
                                    filter: [],
                                },
                            },
                        },
                    },
                },
                _source_excludes: queryAccessExcludes,
                _source_includes: queryAccessIncludes,
            });
        });

        it('should be able to return a restricted query without any params', async () => {
            const result = await queryAccess.restrictSearchQuery('foo:bar');
            expect(result).toMatchObject({
                _source_excludes: queryAccessExcludes,
                _source_includes: queryAccessIncludes,
            });

            expect(result).not.toHaveProperty('q', 'idk');
        });

        it('should be able to return a restricted geo query and add the geo sort', async () => {
            const q = 'foo:geoDistance(point:"33.435518,-111.873616" distance:5000yd)';
            const result = await queryAccess.restrictSearchQuery(q, {
                geo_sort_order: 'asc'
            });

            expect(result).toMatchObject({
                body: {
                    sort: {
                        _geo_distance: {
                            order: 'asc',
                            unit: 'yards',
                            foo: {
                                lat: 33.435518,
                                lon: -111.873616,
                            }
                        }
                    }
                }
            });
        });

        it('should be able to return a query with a default sort when geo_sort_point is passed in', async () => {
            const q = 'foo:bar';
            const result = await queryAccess.restrictSearchQuery(q, {
                geo_sort_point: {
                    lat: 55.435518,
                    lon: -101.873616,
                }
            });

            expect(result).toMatchObject({
                body: {
                    sort: {
                        _geo_distance: {
                            order: 'desc',
                            unit: 'millimeters',
                            moo: {
                                lat: 55.435518,
                                lon: -101.873616,
                            }
                        }
                    }
                }
            });
        });

        it('can process quoted values correctly', async () => {
            const q = 'foo:"something-xy40\\" value 8008"';
            const result = await queryAccess.restrictSearchQuery(q);

            expect(result).toMatchObject({
                body: {
                    query: {
                        constant_score: {
                            filter: {
                                match: {
                                    foo: {
                                        operator: 'and',
                                        query: 'something-xy40" value 8008'
                                    }
                                }
                            }
                        }
                    }
                },
                _source_includes: queryAccessIncludes,
                _source_excludes: queryAccessExcludes
            });
        });
    });

    describe('can work with variables', () => {
        const queryAccess = new QueryAccess({
            allow_implicit_queries: true,
            excludes: [],
            includes: [],
            type_config: {
                foo: xLuceneFieldType.String,
                bar: xLuceneFieldType.String,
            },
            variables: {
                foo1: 'hello world',
                foo2: ['some', 'thing'],
                bar1: 'I am bar',
            }
        });

        it('should be able to return string variable opensearch dsl', async () => {
            const q = 'foo:$foo1';
            const result = await queryAccess.restrictSearchQuery(q);

            expect(result).toMatchObject({
                body: {
                    query: {
                        constant_score: {
                            filter: {
                                match: {
                                    foo: {
                                        operator: 'and',
                                        query: 'hello world'
                                    }
                                }
                            }
                        }
                    }
                },
                _source_includes: [],
                _source_excludes: []
            });
        });

        it('should be able to return array string variable opensearch dsl', async () => {
            const q = 'foo:$foo2';
            const result = await queryAccess.restrictSearchQuery(q);

            expect(result).toMatchObject({
                body: {
                    query: {
                        constant_score: {
                            filter: {
                                bool: {
                                    should: [
                                        {
                                            bool: {
                                                filter: [
                                                    {
                                                        match: {
                                                            foo: {
                                                                operator: 'and',
                                                                query: 'some'
                                                            }
                                                        }
                                                    }
                                                ]
                                            }
                                        },
                                        {
                                            bool: {
                                                filter: [
                                                    {
                                                        match: {
                                                            foo: {
                                                                operator: 'and',
                                                                query: 'thing'
                                                            }
                                                        }
                                                    }
                                                ]
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    }
                },
                _source_includes: [],
                _source_excludes: []
            });
        });

        it('should be able to add additional variables', async () => {
            const variables = {
                foo3: 'iAmVariable'
            };
            const q = 'foo:$foo3';
            const result = await queryAccess.restrictSearchQuery(q, { variables });

            expect(result).toMatchObject({
                body: {
                    query: {
                        constant_score: {
                            filter: {
                                match: {
                                    foo: {
                                        operator: 'and',
                                        query: variables.foo3
                                    }
                                }
                            }
                        }
                    }
                },
                _source_includes: [],
                _source_excludes: []
            });
        });

        it('should be able to override default variables', async () => {
            const variables = {
                bar1: 'iAmVariable'
            };
            const q = 'foo:$bar1';
            const result = await queryAccess.restrictSearchQuery(q, { variables });

            expect(result).toMatchObject({
                body: {
                    query: {
                        constant_score: {
                            filter: {
                                match: {
                                    foo: {
                                        operator: 'and',
                                        query: variables.bar1
                                    }
                                }
                            }
                        }
                    }
                },
                _source_includes: [],
                _source_excludes: []
            });
        });

        it('does not used cached translator if variables have changed', async () => {
            const q1 = 'bar:$bar1';
            const result1 = await queryAccess.restrictSearchQuery(q1);

            expect(result1).toMatchObject({
                body: {
                    query: {
                        constant_score: {
                            filter: {
                                match: {
                                    bar: {
                                        operator: 'and',
                                        query: 'I am bar'
                                    }
                                }
                            }
                        }
                    }
                },
                _source_includes: [],
                _source_excludes: []
            });

            const variables = {
                bar1: 'i-am-a-variable'
            };
            const q2 = 'bar:$bar1';
            const result2 = await queryAccess.restrictSearchQuery(q2, { variables });

            expect(result2).toMatchObject({
                body: {
                    query: {
                        constant_score: {
                            filter: {
                                match: {
                                    bar: {
                                        operator: 'and',
                                        query: variables.bar1
                                    }
                                }
                            }
                        }
                    }
                },
                _source_includes: [],
                _source_excludes: []
            });
        });

        it('can work with numerical variables provided through restrictSearchQuery options', async () => {
            const queryAccessVariables = new QueryAccess({
                allow_implicit_queries: true,
                filterNilVariables: false,
                allow_empty_queries: false,
                excludes: [],
                includes: ['foo'],
                type_config: {
                    foo: xLuceneFieldType.Integer,
                    bar: xLuceneFieldType.String,
                }
            });

            const variables = {
                foo1: 1,
                foo2: ['some', 'thing'],
                bar1: 'I am bar',
            };

            const q = 'foo:$foo1';
            const result = await queryAccessVariables.restrictSearchQuery(q, { variables });

            expect(result).toMatchObject({
                body: {
                    query: {
                        constant_score: {
                            filter: {
                                term: {
                                    foo: 1
                                }
                            }
                        }
                    }
                },
                _source_includes: ['foo'],
                _source_excludes: []
            });
        });
    });

    describe('can work with filterNilVariables set true', () => {
        it('should filter out undefined variables', async () => {
            const queryAccess = new QueryAccess({
                allow_implicit_queries: true,
                excludes: [],
                includes: [],
                type_config: {
                    name: xLuceneFieldType.String,
                    age: xLuceneFieldType.Integer,
                },
                variables: {
                    age: 20,
                },
                filterNilVariables: true
            });

            const q = 'name:$name AND age:$age';
            const result = await queryAccess.restrictSearchQuery(q);

            expect(result).toMatchObject({
                body: {
                    query: {
                        constant_score: {
                            filter: {
                                term: {
                                    age: 20
                                }
                            }
                        }
                    }
                },
                _source_includes: [],
                _source_excludes: []
            });
        });
    });
});
