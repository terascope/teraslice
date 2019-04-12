import { TestCase } from './interfaces';

export default [
    ['any_count:(50 OR 40 OR 30)', 'query.constant_score.filter.bool', {
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
    }],
    ['id:(hi OR hello OR howdy OR aloha OR hey OR sup)', 'query.constant_score.filter', {
        bool: {
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
    }],
] as TestCase[];
