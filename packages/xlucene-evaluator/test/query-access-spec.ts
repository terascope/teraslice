import 'jest-extended';
import { SearchParams } from 'elasticsearch';
import { TSError } from '@terascope/utils';
import { QueryAccess, FieldType } from '../src';

describe('QueryAccess', () => {
    describe('when constructed without type_config', () => {
        it('should throw an error', () => {
            expect(() => new QueryAccess({})).toThrowError('type_config must be provided');
        });
    });

    describe('when constructed without exclude', () => {
        it('should set an empty array', () => {
            const queryAccess = new QueryAccess({}, { type_config: { foo: FieldType.String } });

            expect(queryAccess.excludes).toBeArrayOfSize(0);
        });
    });

    describe('when constructed with exclusive fields', () => {
        const queryAccess = new QueryAccess({
            excludes: ['bar', 'moo', 'baa.maa', 'a.b'],
        }, {
            type_config: {
                bar: FieldType.String,
                moo: FieldType.String,
                baa: FieldType.Object,
                a: FieldType.Object
            }
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

                expect(() => queryAccess.restrict(query)).toThrowError('Field bar.hello in query is restricted');
            });
        });

        describe('when passed queries with moo in field', () => {
            it('should throw when input query is restricted', () => {
                const query = 'moo:example';

                expect(() => queryAccess.restrict(query)).toThrowError('Field moo in query is restricted');
            });
        });

        describe('when passed queries with a nested baa.maa field', () => {
            it('should throw when input query is restricted', () => {
                const query = 'baa.maa:example';

                expect(() => queryAccess.restrict(query)).toThrowError('Field baa.maa in query is restricted');
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

                expect(() => queryAccess.restrict(query)).toThrowError('Field a.b.c in query is restricted');
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
            includes: ['bar', 'star'],
        }, {
            type_config: {
                bar: FieldType.String,
                start: FieldType.String,
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

            const result = new QueryAccess({
                allow_implicit_queries: true,
            }, {
                type_config: {
                    bar: FieldType.String,
                }
            }).restrict(query);

            expect(result).toEqual(query);
        });

        it('should throw if field is not included', () => {
            const query = 'hello:world AND bar:foo';

            expect(() => queryAccess.restrict(query)).toThrow();
        });

        it('should throw if passed an empty query', () => {
            expect(() => new QueryAccess({
                allow_empty_queries: false,
            }, {
                type_config: {
                    bar: FieldType.String,
                }
            }).restrict('')).toThrowWithMessage(TSError, 'Empty queries are restricted');
        });

        it('should return an empty query when allowed', () => {
            expect(
                new QueryAccess({
                    allow_empty_queries: true,
                }, {
                    type_config: {
                        bar: FieldType.String,
                    }
                }).restrict('')
            ).toEqual('');
        });

        it('should return constraint if given an empty query', () => {
            expect(
                new QueryAccess({
                    allow_empty_queries: true,
                    constraint: 'foo:bar',
                }, {
                    type_config: {
                        foo: FieldType.String,
                        bar: FieldType.String
                    }
                }).restrict('')
            ).toEqual('foo:bar');
        });

        it('should allow field listed if included', () => {
            const query = 'bar:foo';

            expect(queryAccess.restrict(query)).toEqual(query);
        });

        it('should allow field listed if included', () => {
            const query = 'bar:[0 TO *] OR star:(0 OR 2)';

            expect(queryAccess.restrict(query)).toEqual(query);
        });

        describe('when given an empty query', () => {
            it('should be able to default to constraint query', () => {
                const result = new QueryAccess({
                    constraint: 'foo:bar',
                }, {
                    type_config: {
                        foo: FieldType.String,
                    }
                }).restrict('');
                expect(result).toEqual('foo:bar');
            });
        });

        describe('when given null', () => {
            it('should be able to default to constraint query', () => {
                // @ts-ignore
                const query: string = null;

                const result = new QueryAccess({
                    constraint: 'foo:bar',
                }, {
                    type_config: {
                        foo: FieldType.String,
                    }
                }).restrict(query);
                expect(result).toEqual('foo:bar');
            });
        });

        describe('when given undefined', () => {
            it('should be able to default to constraint query', () => {
                // @ts-ignore
                const query: string = undefined;

                const result = new QueryAccess({
                    constraint: 'foo:bar',
                }, {
                    type_config: {
                        foo: FieldType.String,
                    }
                }).restrict(query);
                expect(result).toEqual('foo:bar');
            });
        });
    });

    describe('when using a field wildcard', () => {
        it('should not throw if includes matches field wildcard', () => {
            const queryAccess = new QueryAccess({
                includes: ['field_'],
            }, {
                type_config: {
                    field_one: FieldType.String,
                    field_two: FieldType.String,
                }
            });

            const query = 'field_*:bar';
            expect(() => queryAccess.restrict(query)).not.toThrow();
        });

        it('should throw if includes does not match all fields', () => {
            const queryAccess = new QueryAccess({
                includes: ['field_'],
            }, {
                type_config: {
                    field_one: FieldType.String,
                    field_two: FieldType.String,
                    foo: FieldType.String
                }
            });

            const query = 'field_*:bar AND foo:bar';
            expect(() => queryAccess.restrict(query)).toThrow();
        });

        it('should not throw if type_config field has valid matching fields', () => {
            const queryAccess = new QueryAccess({
                includes: ['field_one'],
            }, {
                type_config: {
                    field_one: FieldType.String,
                    field_two: FieldType.String,
                }
            });

            const query = 'field_*:bar';
            expect(() => queryAccess.restrict(query)).not.toThrow();
        });

        it('should throw if excludes matches all fields wildcard query', () => {
            const queryAccess = new QueryAccess({
                excludes: ['field_'],
            }, {
                type_config: {
                    field_one: FieldType.String,
                    field_two: FieldType.String,
                }
            });

            const query = 'field_*:bar';
            expect(() => queryAccess.restrict(query)).toThrow();
        });

        it('should not throw if field wildcard query is not restricted on all variants', () => {
            const queryAccess = new QueryAccess({
                excludes: ['field_two'],
            }, {
                type_config: {
                    field_one: FieldType.String,
                    field_two: FieldType.String,
                }
            });

            const query = 'field_*:bar';
            expect(queryAccess.restrict(query)).toEqual(query);
        });

        it('should throw if excludes contains all variants for field wildcard query', () => {
            const queryAccess = new QueryAccess({
                excludes: ['field_one', 'field_two'],
            }, {
                type_config: {
                    field_one: FieldType.String,
                    field_two: FieldType.String,
                }
            });

            const query = 'field_*:bar';
            expect(() => queryAccess.restrict(query)).toThrow();
        });
    });

    describe('when using a constraint that is not restricted', () => {
        const constraint = 'foo:bar';
        const queryAccess = new QueryAccess({
            constraint,
        }, {
            type_config: {
                foo: FieldType.String,
                hello: FieldType.String
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
        }, {
            type_config: {
                foo: FieldType.String,
                hello: FieldType.String,
            }
        });

        it('should return the query', () => {
            const query = 'foo:bar';

            expect(queryAccess.restrict(query)).toEqual(`(${constraint}) AND (${query})`);
        });
    });

    describe('when resticting prefix wildcards', () => {
        const queryAccess = new QueryAccess({
            prevent_prefix_wildcard: true,
        }, {
            type_config: {
                bar: FieldType.String,
                hello: FieldType.String,
                bytes: FieldType.Integer
            }
        });

        describe.each([['hello:*world'], ['hello:?world']])('when using a query of "%s"', (query) => {
            it('should throw an error', () => {
                expect(() => queryAccess.restrict(query)).toThrowWithMessage(
                    TSError,
                    "Wildcard queries of the form 'fieldname:*value' or 'fieldname:?value' in query are restricted"
                );
            });
        });

        it('should work range queries', () => {
            const query = 'hello:world AND bytes:{2000 TO *]';

            expect(queryAccess.restrict(query)).toEqual(query);
        });
    });

    describe('when converting to an elasticsearch search query', () => {
        const queryAccess = new QueryAccess({
            allow_implicit_queries: true,
            default_geo_field: 'moo',
            default_geo_sort_order: 'desc',
            default_geo_sort_unit: 'mm',
            excludes: ['bar', 'baz'],
            includes: ['foo', 'moo'],
        }, {
            type_config: {
                moo: FieldType.GeoPoint,
                bar: FieldType.String,
                baz: FieldType.String,
                foo: FieldType.String,
            }
        });

        it('should be able to return a restricted query', () => {
            const params: SearchParams = {
                q: 'idk',
                _sourceInclude: ['moo'],
                _sourceExclude: ['baz'],
            };

            const result = queryAccess.restrictSearchQuery('foo:bar', {
                params
            });
            expect(result).toMatchObject({
                _sourceExclude: ['baz'],
                _sourceInclude: ['moo'],
            });

            expect(params).toHaveProperty('q', 'idk');
            expect(result).not.toHaveProperty('q', 'idk');
        });

        it('should be able to allow * queries', () => {
            const result = queryAccess.restrictSearchQuery('*');
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
                _sourceExclude: ['bar', 'baz'],
                _sourceInclude: ['foo', 'moo'],
            });
        });

        it('should be able to return a restricted query without any params', () => {
            const result = queryAccess.restrictSearchQuery('foo:bar');
            expect(result).toMatchObject({
                _sourceExclude: ['bar', 'baz'],
                _sourceInclude: ['foo', 'moo'],
            });

            expect(result).not.toHaveProperty('q', 'idk');
        });

        it('should be able to return a restricted geo query and add the geo sort', () => {
            const q = 'foo:(_geo_point_:"33.435518,-111.873616" _geo_distance_:5000yd)';
            const result = queryAccess.restrictSearchQuery(q, {
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

        it('should be able to return a query with a default sort when geo_sort_point is passed in', () => {
            const q = 'foo:bar';
            const result = queryAccess.restrictSearchQuery(q, {
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

        it('can process quoted values correctly', () => {
            const q = 'foo:"something-xy40\\" value 8008"';
            const result = queryAccess.restrictSearchQuery(q);

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
                _sourceInclude: [
                    'foo',
                    'moo'
                ],
                _sourceExclude: [
                    'bar',
                    'baz'
                ]
            });
        });
    });
});
