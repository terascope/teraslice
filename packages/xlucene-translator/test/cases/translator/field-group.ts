import { TestCase } from './interfaces.js';

export default [
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
                                },
                            },
                        ],
                    },
                },
                {
                    bool: {
                        filter: [
                            {
                                term: {
                                    any_count: 40,
                                },
                            },
                        ],
                    },
                },
                {
                    bool: {
                        filter: [
                            {
                                term: {
                                    any_count: 30,
                                },
                            },
                        ],
                    },
                },
            ],
        },
    ],
    [
        'id:(hi OR hello OR howdy OR aloha OR hey OR sup)',
        'query.constant_score.filter',
        {
            bool: {
                should: [
                    {
                        bool: {
                            filter: [
                                {
                                    match: {
                                        id: {
                                            query: 'hi',
                                            operator: 'and',
                                        },
                                    },
                                },
                            ],
                        },
                    },
                    {
                        bool: {
                            filter: [
                                {
                                    match: {
                                        id: {
                                            query: 'hello',
                                            operator: 'and',
                                        },
                                    },
                                },
                            ],
                        },
                    },
                    {
                        bool: {
                            filter: [
                                {
                                    match: {
                                        id: {
                                            query: 'howdy',
                                            operator: 'and',
                                        },
                                    },
                                },
                            ],
                        },
                    },
                    {
                        bool: {
                            filter: [
                                {
                                    match: {
                                        id: {
                                            query: 'aloha',
                                            operator: 'and',
                                        },
                                    },
                                },
                            ],
                        },
                    },
                    {
                        bool: {
                            filter: [
                                {
                                    match: {
                                        id: {
                                            query: 'hey',
                                            operator: 'and',
                                        },
                                    },
                                },
                            ],
                        },
                    },
                    {
                        bool: {
                            filter: [
                                {
                                    match: {
                                        id: {
                                            query: 'sup',
                                            operator: 'and',
                                        },
                                    },
                                },
                            ],
                        },
                    },
                ],
            },
        },
    ],
] as TestCase[];
