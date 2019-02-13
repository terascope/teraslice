import 'jest-extended';
import { Translator, TypeConfig } from '../src';

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
                filter: [
                    {
                        bool: {
                            filter: [],
                            must_not: [],
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
                            ]
                        }
                    }
                ],
                should: [],
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
            '_exists_:howdy AND other:>=50 OR foo:bar NOT bar:foo',
            'query.constant_score.filter.bool.filter',
            [
                {
                    exists: {
                        field: 'howdy'
                    }
                },
                {
                    bool: {
                        filter: [],
                        must_not: [],
                        should: [
                            {
                                range: {
                                    other: {
                                        gte: 50
                                    }
                                }
                            },
                            {
                                bool: {
                                    filter: [],
                                    must_not: [
                                        {
                                            term: {
                                                foo: 'bar'
                                            }
                                        },
                                        {
                                            term: {
                                                bar: 'foo'
                                            }
                                        }
                                    ],
                                    should: []
                                }
                            }
                        ]
                    }
                }
            ]
        ],
        [
            'some:query OR other:thing',
            'query.constant_score.filter.bool.should',
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
            'some:query NOT other:thing',
            'query.constant_score.filter.bool.must_not',
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
                        distance:'5000m',
                        loc: '33.435518,-111.873616'
                    }
                }
            ]
        ]
    ])('when given %s', (query, property, expected, types) => {
        it(`should to output to have ${property} set correctly`, () => {
            const translator = new Translator(query, types);
            const result = translator.toElasticsearchDSL();
            expect(result).toHaveProperty(property, expected);
        });
    });
});
