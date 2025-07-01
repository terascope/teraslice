import { BoolQuery } from 'packages/types/dist/src/elasticsearch-interfaces.js';
import { TestCase } from './interfaces.js';

const variables = {
    variables: {
        some_array: ['foo', 'bar'],
        thing: 'something'
    }
};
const fooBarArrayTranslated: BoolQuery = {
    bool: {
        should: [{
            bool: {
                filter: [{
                    match: {
                        some: {
                            operator: 'and',
                            query: 'foo'
                        }
                    }
                }]
            }
        },
        {
            bool: {
                filter: [{
                    match: {
                        some: {
                            operator: 'and',
                            query: 'bar'
                        }
                    }
                }]
            }
        }]
    }
};
const cases: TestCase[] = [
    [
        'some:$some_array',
        'query.constant_score.filter',
        fooBarArrayTranslated,
        variables
    ],
    [
        'some:$some_array AND other:$thing',
        'query.constant_score.filter',
        {
            bool: {
                should: [{
                    bool: {
                        filter: [
                            fooBarArrayTranslated,
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
                }]
            }
        },
        variables
    ],
    [
        'some:$some_array OR other:$thing',
        'query.constant_score.filter',
        {
            bool: {
                should: [{
                    bool: {
                        filter: [
                            fooBarArrayTranslated
                        ]
                    }
                },
                {
                    bool: {
                        filter: [{
                            match: {
                                other: {
                                    operator: 'and',
                                    query: 'something'
                                }
                            }
                        }]
                    }
                }]
            }
        },
        variables
    ],
    [
        '(some:$some_array OR other:$thing) AND another:$thing',
        'query.constant_score.filter',
        {
            bool: {
                should: [{
                    bool: {
                        filter: [{
                            bool: {
                                should: [{
                                    bool: {
                                        filter: [
                                            fooBarArrayTranslated
                                        ]
                                    }
                                },
                                {
                                    bool: {
                                        filter: [{
                                            match: {
                                                other: {
                                                    operator: 'and',
                                                    query: 'something'
                                                }
                                            }
                                        }]
                                    }
                                }]
                            }
                        },
                        {
                            match: {
                                another: {
                                    operator: 'and',
                                    query: 'something'
                                }
                            }
                        }]
                    }
                }]
            }
        },
        variables
    ],
    [
        '(some:$some_array OR other:$thing) OR another:$thing',
        'query.constant_score.filter',
        {
            bool: {
                should: [{
                    bool: {
                        filter: [{
                            bool: {
                                should: [{
                                    bool: {
                                        filter: [
                                            fooBarArrayTranslated
                                        ]
                                    }
                                },
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
                                }]
                            }
                        }]
                    }
                },
                {
                    bool: {
                        filter: [{
                            match: {
                                another: {
                                    operator: 'and',
                                    query: 'something'
                                }
                            }
                        }]
                    }
                }]
            }
        },
        variables
    ],
    [
        '(some:$some_array AND other:$thing) OR another:$thing',
        'query.constant_score.filter',
        {
            bool: {
                should: [{
                    bool: {
                        filter: [{
                            bool: {
                                should: [{
                                    bool: {
                                        filter: [
                                            fooBarArrayTranslated,
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
                                }]
                            }
                        }]
                    }
                },
                {
                    bool: {
                        filter: [{
                            match: {
                                another: {
                                    operator: 'and',
                                    query: 'something'
                                }
                            }
                        }]
                    }
                }]
            }
        },
        variables
    ],
    [
        '(some:$some_array AND other:$thing) AND another:$thing',
        'query.constant_score.filter',
        {
            bool: {
                should: [{
                    bool: {
                        filter: [{
                            bool: {
                                should: [{
                                    bool: {
                                        filter: [
                                            fooBarArrayTranslated,
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
                                }]
                            }
                        },
                        {
                            match: {
                                another: {
                                    operator: 'and',
                                    query: 'something'
                                }
                            }
                        }]
                    }
                }]
            }
        },
        variables
    ],
];

const variablesWithEmptyArray = {
    variables: {
        empty_array: [],
        thing: 'something'
    }
};
const emptyArrayCases: TestCase[] = [
    [
        'some:$empty_array',
        '',
        {
            query: { match_none: {} }
        },
        variablesWithEmptyArray
    ],
    [
        'some:$empty_array AND other:$thing',
        '',
        {
            query: { match_none: {} }
        },
        variablesWithEmptyArray
    ],
    [
        'some:$empty_array OR other:$thing',
        'query.constant_score.filter',
        {
            bool: {
                should: [
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
                ]
            }
        },
        variablesWithEmptyArray
    ],
    [
        '(some:$empty_array OR other:$thing) AND another:$thing',
        'query.constant_score.filter',
        {
            bool: {
                should: [
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
                ]
            }
        },
        variablesWithEmptyArray
    ],
    [
        '(some:$empty_array OR other:$thing) OR another:$thing',
        'query.constant_score.filter',
        {
            bool: {
                should: [
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
                ]
            }
        },
        variablesWithEmptyArray
    ],
    [
        '(some:$empty_array AND other:$thing) OR another:$thing',
        'query.constant_score.filter',
        {
            bool: {
                should: [
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
                ]
            }
        },
        variablesWithEmptyArray
    ],
    [
        '(some:$empty_array AND other:$thing) AND another:$thing',
        '',
        {
            query: { match_none: {} },
        },
        variablesWithEmptyArray
    ],
];

export default cases.concat(emptyArrayCases);
