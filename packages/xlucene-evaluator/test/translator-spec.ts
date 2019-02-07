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
            {
                query: {
                    bool: {
                        filter: [
                            {
                                term: {
                                    hello: 'world'
                                }
                            }
                        ]
                    }
                }
            }
        ],
        [
            'hello:w?rld',
            {
                query: {
                    bool: {
                        filter: [
                            {
                                wildcard: {
                                    hello: 'w?rld'
                                }
                            }
                        ]
                    }
                }
            }
        ],
        [
            '_exists_:hello',
            {
                query: {
                    bool: {
                        filter: [
                            {
                                exists: {
                                    field: 'hello'
                                }
                            }
                        ]
                    }
                }
            }
        ],
        [
            'hello:/w.*ld/',
            {
                query: {
                    bool: {
                        filter: [
                            {
                                regexp: {
                                    hello: 'w.*ld'
                                }
                            }
                        ]
                    }
                }
            }
        ],
        [
            'example_count:>=30',
            {
                query: {
                    bool: {
                        filter: [
                            {
                                range: {
                                    example_count: {
                                        gte: 30
                                    }
                                }
                            }
                        ]
                    }
                }
            }
        ],
        [
            'example_count:>30',
            {
                query: {
                    bool: {
                        filter: [
                            {
                                range: {
                                    example_count: {
                                        gt: 30
                                    }
                                }
                            }
                        ]
                    }
                }
            }
        ],
        [
            'example_count:<50',
            {
                query: {
                    bool: {
                        filter: [
                            {
                                range: {
                                    example_count: {
                                        lt: 50
                                    }
                                }
                            }
                        ]
                    }
                }
            }
        ],
        [
            'example_count:<=50',
            {
                query: {
                    bool: {
                        filter: [
                            {
                                range: {
                                    example_count: {
                                        lte: 50
                                    }
                                }
                            }
                        ]
                    }
                }
            }
        ],
        // [
        //     'location:(_geo_box_top_left_:"34.5234,79.42345" _geo_box_bottom_right_:"54.5234,80.3456")',
        //     {
        //         query: {
        //             bool: {
        //                 must: [
        //                     {
        //                         geo_bounding_box: {
        //                             location: {
        //                                 top_left: {
        //                                     lat: '34.5234',
        //                                     lon: '79.42345'
        //                                 },
        //                                 bottom_right: {
        //                                     lat: '54.5234',
        //                                     lon: '80.3456'
        //                                 }
        //                             }
        //                         }
        //                     }
        //                 ]
        //             }
        //         }
        //     }
        // ]
    ])('when given %s', (query, expected, types) => {
        it('should output a dsl query', () => {
            const translator = new Translator(query, types);
            expect(translator.toElasticsearchDSL()).toEqual(expected);
        });
    });
});
