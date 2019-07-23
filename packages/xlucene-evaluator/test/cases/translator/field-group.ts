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
