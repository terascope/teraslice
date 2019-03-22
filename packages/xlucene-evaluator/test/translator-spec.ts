import 'jest-extended';
import get from 'lodash/get';
import { debugLogger } from '@terascope/utils';
import { Translator, TypeConfig, AST } from '../src';
import { getJoinType } from '../src/translator/utils';

const logger = debugLogger('translator-spec');

describe('Translator', () => {
    it('should have a query property', () => {
        const query = 'foo:bar';
        const translator = new Translator(query);

        expect(translator).toHaveProperty('query', query);
    });

    it('should have a types property', () => {
        const query = 'foo:bar';
        const types: TypeConfig = {
            location: 'geo',
        };

        const translator = new Translator(query, types);

        expect(translator).toHaveProperty('types', types);
    });

    describe.each([
        [
            '*',
            'query.constant_score.filter.bool.filter',
            []
        ],
        [
            'hello:world',
            'query.constant_score.filter.bool.filter',
            [
                {
                    term: {
                        hello: 'world'
                    }
                }
            ]
        ],
        [
            'hello:w?rld',
            'query.constant_score.filter.bool.filter',
            [
                {
                    wildcard: {
                        hello: 'w?rld'
                    }
                }
            ]
        ],
        [
            '_exists_:hello',
            'query.constant_score.filter.bool.filter',
            [
                {
                    exists: {
                        field: 'hello'
                    }
                }
            ]
        ],
        [
            'hello:/w.*ld/',
            'query.constant_score.filter.bool.filter',
            [
                {
                    regexp: {
                        hello: 'w.*ld'
                    }
                }
            ]
        ],
        [
            'example_count:>=30',
            'query.constant_score.filter.bool.filter',
            [
                {
                    range: {
                        example_count: {
                            gte: 30
                        }
                    }
                }
            ]
        ],
        [
            'example_count:>30',
            'query.constant_score.filter.bool.filter',
            [
                {
                    range: {
                        example_count: {
                            gt: 30
                        }
                    }
                }
            ]
        ],
        [
            'example_count:<50',
            'query.constant_score.filter.bool.filter',
            [
                {
                    range: {
                        example_count: {
                            lt: 50
                        }
                    }
                }
            ]
        ],
        [
            'example_count:<=50',
            'query.constant_score.filter.bool.filter',
            [
                {
                    range: {
                        example_count: {
                            lte: 50
                        }
                    }
                }
            ]
        ],
        [
            'any_count:(50 OR 40 OR 30)',
            'query.constant_score.filter.bool',
            {
                filter: [],
                should: [
                    {
                        term: {
                            any_count: 50,
                        }
                    },
                    {
                        term: {
                            any_count: 40,
                        }
                    },
                    {
                        term: {
                            any_count: 30,
                        }
                    }
                ],
                must_not: [],
            }
        ],
        [
            'id:(hi OR hello OR howdy OR aloha OR hey OR sup)',
            'query.constant_score.filter.bool',
            {
                filter: [],
                should: [
                    {
                        term: {
                            id: 'hi',
                        }
                    },
                    {
                        term: {
                            id: 'hello',
                        }
                    },
                    {
                        term: {
                            id: 'howdy',
                        }
                    },
                    {
                        term: {
                            id: 'aloha',
                        }
                    },
                    {
                        term: {
                            id: 'hey',
                        }
                    },
                    {
                        term: {
                            id: 'sup',
                        }
                    }
                ],
                must_not: [],
            }
        ],
        [
            'some:query AND other:thing',
            'query.constant_score.filter.bool.filter',
            [
                {
                    term: {
                        some: 'query',
                    }
                },
                {
                    term: {
                        other: 'thing',
                    }
                }
            ]
        ],
        [
            'NOT value:awesome AND other:thing',
            'query.constant_score.filter.bool',
            {
                filter: [
                    {
                        term: {
                            other: 'thing'
                        }
                    }
                ],
                must_not: [
                    {
                        term: {
                            value: 'awesome'
                        }
                    }
                ],
                should: []
            }
        ],
        [
            '_exists_:howdy AND other:>=50 OR foo:bar NOT bar:foo',
            'query.constant_score.filter.bool',
            {
                filter: [
                    {
                        exists: {
                            field: 'howdy'
                        }
                    },
                    {
                        bool: {
                            filter: [
                                {
                                    range: {
                                        other: {
                                            gte: 50
                                        }
                                    }
                                },
                            ],
                            must_not: [
                                {
                                    term: {
                                        bar: 'foo'
                                    }
                                }
                            ],
                            should: [
                                {
                                    term: {
                                        foo: 'bar'
                                    }
                                },
                            ]
                        }
                    }
                ],
                must_not: [],
                should: [],
            }
        ],
        [
            'some:key AND (_created:>="2018-10-18T18:13:20.683Z" && bytes:(>=150000 AND <=1232322))',
            'query.constant_score.filter.bool.filter',
            [
                {
                    term: {
                        some: 'key'
                    }
                },
                {
                    range: {
                        _created: {
                            gte: '2018-10-18T18:13:20.683Z'
                        }
                    }
                },
                {
                    range: {
                        bytes: {
                            gte: 150000,
                            lte: 1232322
                        }
                    }
                }
            ]
        ],
        [
            'some:query OR other:thing',
            'query.constant_score.filter.bool',
            {
                filter: [
                    {
                        term: {
                            some: 'query'
                        }
                    },
                ],
                must_not: [],
                should: [
                    {
                        term: {
                            other: 'thing'
                        }
                    },
                ]
            }
        ],
        [
            'some:query NOT other:thing',
            'query.constant_score.filter.bool',
            {
                filter: [
                    {
                        term: {
                            some: 'query'
                        }
                    }
                ],
                must_not: [
                    {
                        term: {
                            other: 'thing'
                        }
                    }
                ],
                should: []
            }
        ],
        [
            'location:(_geo_box_top_left_:"34.5234,79.42345" _geo_box_bottom_right_:"54.5234,80.3456")',
            'query.constant_score.filter.bool.filter',
            [
                {
                    geo_bounding_box: {
                        location: {
                            top_left: '34.5234,79.42345',
                            bottom_right: '54.5234,80.3456'
                        }
                    }
                }
            ]
        ],
        [
            'loc:(_geo_point_:"33.435518,-111.873616" _geo_distance_:5000m)',
            'query.constant_score.filter.bool.filter',
            [
                {
                    geo_distance: {
                        distance: '5000m',
                        loc: '33.435518,-111.873616'
                    }
                }
            ]
        ]
    // @ts-ignore because the types for test.each for some reason
    ])('when given %s', (query: string, property: string, expected: any, types: TypeConfig) => {
        it('should translate the query correctly', () => {
            const translator = new Translator(query, types);
            const result = translator.toElasticsearchDSL();

            logger.trace('test result', JSON.stringify({
                query,
                expected,
                property,
                actual: get(result, property),
            }, null, 4));

            expect(result).toHaveProperty(property, expected);
        });
    });

    describe('when getting the join type', () => {
        describe('when given a complex AND/OR/NOT AST', () => {
            const node = {
                type: 'conjunction',
                left: {
                    type: 'exists',
                    field: 'howdy'
                } as AST,
                parens: false,
                operator: 'AND',
                right: {
                    type: 'conjunction',
                    left: {
                        type: 'range',
                        term_min: 50,
                        term_max: Infinity,
                        inclusive_min: true,
                        inclusive_max: true,
                        field: 'other'
                    } as AST,
                    parens: false,
                    operator: 'OR',
                    right: {
                        type: 'conjunction',
                        left: {
                            field: 'foo',
                            type: 'term',
                            term: 'bar',
                            wildcard: false,
                            regexpr: false,
                        } as AST,
                        parens: false,
                        operator: 'AND',
                        right: {
                            field: 'bar',
                            type: 'term',
                            term: 'foo',
                            wildcard: false,
                            regexpr: false,
                            negated: true
                        } as AST
                    } as AST
                } as AST
            } as AST;

            it('should correctly handle the AND left join type', () => {
                expect(getJoinType(node, 'left')).toEqual('filter');
            });

            it('should correctly handle the AND right join type', () => {
                expect(getJoinType(node, 'right')).toEqual('filter');
            });

            it('should correctly handle the OR left join type', () => {
                expect(getJoinType(node.right!, 'left')).toEqual('filter');
            });

            it('should correctly handle the OR right join type', () => {
                expect(getJoinType(node.right!, 'right')).toEqual('should');
            });

            it('should correctly handle the NOT right join type', () => {
                expect(getJoinType(node.right!.right!, 'right')).toEqual('must_not');
            });
        });

        describe('when given a chained OR statement AST', () => {
            const node = {
                type: 'conjunction',
                left: {
                    type: 'conjunction',
                    left: {
                        field: '<implicit>',
                        type: 'term',
                        term: 50,
                        wildcard: false,
                        regexpr: false,
                    } as AST,
                    parens: true,
                    operator: 'OR',
                    right: {
                        type: 'conjunction',
                        left: {
                            field: '<implicit>',
                            type: 'term',
                            term: 40,
                            unrestricted: false,
                            wildcard: false,
                            regexpr: false,
                        } as AST,
                        parens: false,
                        operator: 'OR',
                        right: {
                            field: '<implicit>',
                            type: 'term',
                            term: 30,
                            unrestricted: false,
                            wildcard: false,
                            regexpr: false,
                        } as AST,
                        field: 'any_count'
                    } as AST,
                    field: 'any_count'
                } as AST,
                parens: false
            } as AST;

            it('should correctly handle the first OR join type', () => {
                expect(getJoinType(node, 'left')).toEqual('should');
            });

            it('should correctly handle the second OR join type', () => {
                expect(getJoinType(node.left!, 'left')).toEqual('should');
            });

            it('should correctly handle the third OR join type', () => {
                expect(getJoinType(node.left!, 'right')).toEqual('should');
            });
        });
    });
});
