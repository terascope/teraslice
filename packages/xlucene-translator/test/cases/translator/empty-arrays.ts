import { TestCase } from './interfaces.js';

export default [
    [
        'some:$empty_array',
        'query',
        {
            match_none: {}
        },
        {
            variables: {
                empty_array: [],
                thing: 'something'
            }
        }
    ],
    [
        'some:$empty_array AND other:$thing',
        'query',
        {
            match_none: {}
        },
        {
            variables: {
                empty_array: [],
                thing: 'something'
            }
        }
    ],
    [
        'some:$empty_array OR other:$thing',
        'query.constant_score.filter.bool.should',
        [
            {
                bool: {
                    filter: [
                        {
                            match: {
                                other: {
                                    query: 'something',
                                    operator: 'and',
                                },
                            },
                        },
                    ],
                },
            },
        ],
        {
            variables: {
                empty_array: [],
                thing: 'something'
            }
        }
    ],
    [
        '(some:$empty_array OR other:$thing) AND another:$thing',
        'query.constant_score.filter.bool.should',
        [
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
                                                    match: {
                                                        other: {
                                                            operator: 'and',
                                                            query: 'something'
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
                            match: {
                                another: {
                                    operator: 'and',
                                    query: 'something'
                                }
                            }
                        }
                    ]
                }
            }
        ],
        {
            variables: {
                empty_array: [],
                thing: 'something'
            }
        }
    ],
    [
        '(some:$empty_array OR other:$thing) OR another:$thing',
        'query.constant_score.filter.bool.should',
        [

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
                                                    match: {
                                                        other: {
                                                            operator: 'and',
                                                            query: 'something'
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
            },
            {
                bool: {
                    filter: [
                        {
                            match: {
                                another: {
                                    operator: 'and',
                                    query: 'something'
                                }
                            }
                        }
                    ]
                }
            }
        ],
        {
            variables: {
                empty_array: [],
                thing: 'something'
            }
        }
    ],
    [
        '(some:$empty_array AND other:$thing) OR another:$thing',
        'query.constant_score.filter.bool.should',
        [
            {
                bool: {
                    filter: [
                        {
                            match: {
                                another: {
                                    query: 'something',
                                    operator: 'and',
                                },
                            },
                        },
                    ],
                },
            },
        ],
        {
            variables: {
                empty_array: [],
                thing: 'something'
            }
        }
    ],
    [
        '(some:$empty_array AND other:$thing) AND another:$thing',
        'query',
        {
            match_none: { },
        },
        {
            variables: {
                empty_array: [],
                thing: 'something'
            }
        }
    ],
] as TestCase[];
