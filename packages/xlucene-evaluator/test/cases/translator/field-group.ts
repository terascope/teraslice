import { TestCase } from './interfaces';

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
                                        operator: 'and',
                                        id: 'hi',
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
                                        operator: 'and',
                                        id: 'hello',
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
                                        operator: 'and',
                                        id: 'howdy',
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
                                        operator: 'and',
                                        id: 'aloha',
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
                                        operator: 'and',
                                        id: 'hey',
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
                                        operator: 'and',
                                        id: 'sup',
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
