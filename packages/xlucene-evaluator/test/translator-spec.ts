import 'jest-extended';
import get from 'lodash/get';
import { debugLogger, TSError } from '@terascope/utils';
import { Translator, TypeConfig } from '../src';
import { AST } from '../src/parser';
import { buildAnyQuery } from '../src/translator/utils';

const logger = debugLogger('translator-spec');

describe('Translator', () => {
    it('should have a query property', () => {
        const query = 'foo:bar';
        const translator = new Translator(query);

        expect(translator).toHaveProperty('query', query);
    });

    it('should return undefined when given an invalid query', () => {
        const node: unknown = { type: 'idk', field: 'a', val: true };
        expect(buildAnyQuery(node as AST)).toBeUndefined();
    });

    it('should throw when missing field on term node', () => {
        const node: unknown = { type: 'term', term: 'hello' };
        expect(() => {
            buildAnyQuery(node as AST);
        }).toThrowWithMessage(TSError, 'Unexpected problem when translating xlucene query');
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
            'query.constant_score.filter',
            {
                bool: {
                    filter:[]
                }
            }
        ],
        [
            'hello:world',
            'query.constant_score.filter',
            {
                term: {
                    hello: 'world'
                }
            }
        ],
        [
            'hello:w?rld',
            'query.constant_score.filter',
            {
                wildcard: {
                    hello: 'w?rld'
                }
            }
        ],
        [
            '_exists_:hello',
            'query.constant_score.filter',
            {
                exists: {
                    field: 'hello'
                }
            }
        ],
        [
            'hello:/w.*ld/',
            'query.constant_score.filter',
            {
                regexp: {
                    hello: 'w.*ld'
                }
            }
        ],
        [
            'example_count:>=30',
            'query.constant_score.filter',
            {
                range: {
                    example_count: {
                        gte: 30
                    }
                }
            }
        ],
        [
            'example_count:>30',
            'query.constant_score.filter',
            {
                range: {
                    example_count: {
                        gt: 30
                    }
                }
            }
        ],
        [
            'example_count:<50',
            'query.constant_score.filter',
            {
                range: {
                    example_count: {
                        lt: 50
                    }
                }
            }
        ],
        [
            'example_count:<=50',
            'query.constant_score.filter',
            {
                range: {
                    example_count: {
                        lte: 50
                    }
                }
            }
        ],
        [
            'any_count:(50 OR 40 OR 30)',
            'query.constant_score.filter.bool',
            {
                should: [
                    {
                        bool: {
                            filter: [
                                {
                                    term: {
                                        any_count: 50,
                                    }
                                },
                            ]
                        }
                    },
                    {
                        bool: {
                            filter: [
                                {
                                    term: {
                                        any_count: 40,
                                    }
                                },
                            ]
                        }
                    },
                    {
                        bool: {
                            filter: [
                                {
                                    term: {
                                        any_count: 30,
                                    },
                                }
                            ]
                        }
                    },
                ],
            }
        ],
        [
            'id:(hi OR hello OR howdy OR aloha OR hey OR sup)',
            'query.constant_score.filter.bool',
            {
                should: [
                    {
                        bool: {
                            filter: [
                                {
                                    term: {
                                        id: 'hi',
                                    }
                                },
                            ]
                        },
                    },
                    {
                        bool: {
                            filter: [
                                {
                                    term: {
                                        id: 'hello',
                                    }
                                },
                            ]
                        },
                    },
                    {
                        bool: {
                            filter: [
                                {
                                    term: {
                                        id: 'howdy',
                                    }
                                },
                            ]
                        }
                    },
                    {
                        bool: {
                            filter: [
                                {
                                    term: {
                                        id: 'aloha',
                                    }
                                },
                            ]
                        }
                    },
                    {
                        bool: {
                            filter: [
                                {
                                    term: {
                                        id: 'hey',
                                    }
                                },
                            ]
                        }
                    },
                    {
                        bool: {
                            filter: [
                                {
                                    term: {
                                        id: 'sup',
                                    }
                                }
                            ]
                        }
                    },
                ],
            }
        ],
        [
            'some:query AND other:thing',
            'query.constant_score.filter.bool.should',
            [
                {
                    bool: {
                        filter: [
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
                    }
                }
            ]
        ],
        [
            'NOT value:awesome AND other:thing',
            'query.constant_score.filter.bool.should[0].bool',
            {
                filter: [
                    {
                        bool: {
                            must_not: [
                                {
                                    term: {
                                        value: 'awesome'
                                    }
                                }
                            ],
                        }
                    },
                    {
                        term: {
                            other: 'thing'
                        }
                    }
                ],
            }
        ],
        [
            'a:1 OR (b:1 AND c:2) OR d:(>=1 AND <=2) AND NOT e:>2',
            'query.constant_score.filter.bool',
            {
                should: [
                    {
                        bool: {
                            filter: [
                                {
                                    term: {
                                        a: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        bool: {
                            filter: [
                                {
                                    bool: {
                                        should: [
                                            {
                                                bool: {
                                                    filter: [
                                                        {
                                                            term: {
                                                                b: 1
                                                            }
                                                        },
                                                        {
                                                            term: {
                                                                c: 2
                                                            }
                                                        }
                                                    ]
                                                }
                                            }
                                        ]
                                    }
                                }
                            ]
                        }
                    },
                    {
                        bool: {
                            filter: [
                                {
                                    bool: {
                                        should: [
                                            {
                                                bool: {
                                                    filter: [
                                                        {
                                                            range: {
                                                                d: {
                                                                    gte: 1
                                                                }
                                                            }
                                                        },
                                                        {
                                                            range: {
                                                                d: {
                                                                    lte: 2
                                                                }
                                                            }
                                                        }
                                                    ]
                                                }
                                            }
                                        ]
                                    }
                                },
                                {
                                    bool: {
                                        must_not: [
                                            {
                                                range: {
                                                    e: {
                                                        gt: 2
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        ],
        [
            'date:[2019-04-01T01:00:00Z TO *] AND field:value AND otherfield:(1 OR 2 OR 5 OR 15 OR 33 OR 28) AND NOT (otherfield:15 AND sometype:thevalue) AND NOT anotherfield:value',
            'query.constant_score.filter.bool.should',
            [
                {
                    bool: {
                        filter: [
                            {
                                range: {
                                    date: {
                                        gte: '2019-04-01T01:00:00Z'
                                    }
                                }
                            },
                            {
                                term: {
                                    field: 'value'
                                }
                            },
                            {
                                bool: {
                                    should: [
                                        {
                                            bool: {
                                                filter: [
                                                    {
                                                        term: {
                                                            otherfield: 1
                                                        }
                                                    }
                                                ]
                                            }
                                        },
                                        {
                                            bool: {
                                                filter: [
                                                    {
                                                        term: {
                                                            otherfield: 2
                                                        }
                                                    }
                                                ]
                                            }
                                        },
                                        {
                                            bool: {
                                                filter: [
                                                    {
                                                        term: {
                                                            otherfield: 5
                                                        }
                                                    }
                                                ]
                                            }
                                        },
                                        {
                                            bool: {
                                                filter: [
                                                    {
                                                        term: {
                                                            otherfield: 15
                                                        }
                                                    }
                                                ]
                                            }
                                        },
                                        {
                                            bool: {
                                                filter: [
                                                    {
                                                        term: {
                                                            otherfield: 33
                                                        }
                                                    }
                                                ]
                                            }
                                        },
                                        {
                                            bool: {
                                                filter: [
                                                    {
                                                        term: {
                                                            otherfield: 28
                                                        }
                                                    }
                                                ]
                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                bool: {
                                    must_not: [
                                        {
                                            bool: {
                                                should: [
                                                    {
                                                        bool: {
                                                            filter: [
                                                                {
                                                                    term: {
                                                                        otherfield: 15
                                                                    }
                                                                },
                                                                {
                                                                    term: {
                                                                        sometype: 'thevalue'
                                                                    }
                                                                }
                                                            ]
                                                        }
                                                    }
                                                ]
                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                bool: {
                                    must_not: [
                                        {
                                            term: {
                                                anotherfield: 'value'
                                            }
                                        }
                                    ]
                                }
                            }
                        ]
                    }
                }
            ]
        ],
        [
            '_exists_:howdy AND other:>=50 OR foo:bar NOT bar:foo',
            'query.constant_score.filter.bool.should',
            [
                {
                    bool: {
                        filter: [
                            {
                                exists: {
                                    field: 'howdy'
                                }
                            },
                            {
                                range: {
                                    other: {
                                        gte: 50
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
                                term: {
                                    foo: 'bar'
                                }
                            },
                            {
                                bool: {
                                    must_not: [
                                        {
                                            term: {
                                                bar: 'foo'
                                            }
                                        }
                                    ]
                                }
                            }
                        ]
                    }
                }
            ]
        ],
        [
            'some:key AND (_created:>="2018-10-18T18:13:20.683Z" && bytes:(>=150000 AND <=1232322))',
            'query.constant_score.filter.bool.should[0].bool.filter',
            [
                {
                    term: {
                        some: 'key'
                    }
                },
                {
                    bool: {
                        should: [
                            {
                                bool: {
                                    filter: [
                                        {
                                            range: {
                                                _created: {
                                                    gte: '2018-10-18T18:13:20.683Z'
                                                }
                                            }
                                        },
                                        {
                                            bool: {
                                                should: [
                                                    {
                                                        bool: {
                                                            filter: [
                                                                {
                                                                    range: {
                                                                        bytes: {
                                                                            gte: 150000
                                                                        }
                                                                    }
                                                                },
                                                                {
                                                                    range: {
                                                                        bytes: {
                                                                            lte: 1232322
                                                                        }
                                                                    }
                                                                }
                                                            ]
                                                        }
                                                    }
                                                ]
                                            }
                                        }
                                    ]
                                }
                            }
                        ]
                    }
                }
            ]
        ],
        [
            'some:query OR other:thing OR next:value',
            'query.constant_score.filter.bool',
            {
                should: [
                    {
                        bool: {
                            filter: [
                                {
                                    term: {
                                        some: 'query'
                                    }
                                },
                            ]
                        }
                    },
                    {
                        bool: {
                            filter: [
                                {
                                    term: {
                                        other: 'thing'
                                    }
                                },
                            ]
                        }
                    },
                    {
                        bool: {
                            filter: [
                                {
                                    term: {
                                        next: 'value'
                                    }
                                },
                            ]
                        }
                    },
                ],
            }
        ],
        [
            'some:query NOT other:thing',
            'query.constant_score.filter.bool.should[0].bool',
            {
                filter: [
                    {
                        term: {
                            some: 'query'
                        }
                    },
                    {
                        bool: {
                            must_not: [
                                {
                                    term: {
                                        other: 'thing'
                                    }
                                }
                            ],
                        }
                    }
                ]
            }
        ],
        [
            'location:(_geo_box_top_left_:"34.5234,79.42345" _geo_box_bottom_right_:"54.5234,80.3456")',
            'query.constant_score.filter',
            {
                geo_bounding_box: {
                    location: {
                        top_left: {
                            lat: 34.5234,
                            lon: 79.42345,
                        },
                        bottom_right: {
                            lat: 54.5234,
                            lon: 80.3456
                        }
                    }
                }
            }
        ],
        [
            'loc:(_geo_point_:"33.435518,-111.873616" _geo_distance_:5000m)',
            'query.constant_score.filter',
            {
                geo_distance: {
                    distance: '5000meters',
                    loc: {
                        lat: 33.435518,
                        lon: -111.873616,
                    }
                }
            }
        ]
    // @ts-ignore because the types for test.each for some reason
    ])('when given %j', (query: string, property: string, expected: any, types: TypeConfig) => {
        it('should translate the query correctly', () => {
            const translator = new Translator(query, types);
            const result = translator.toElasticsearchDSL();

            const actual = get(result, property);
            logger.trace('test result', JSON.stringify({
                query,
                expected,
                property,
                actual,
            }, null, 4));

            if (!actual) {
                expect(result).toHaveProperty(property);
            } else {
                expect(actual).toEqual(expected);
            }
        });
    });

    describe('when given an empty string', () => {
        it('should translate it to an empty query', () => {
            const translator = new Translator('');
            const result = translator.toElasticsearchDSL();
            expect(result).toEqual({
                query: {
                    query_string: {
                        query: ''
                    }
                }
            });
        });
    });

});
