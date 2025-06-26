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
        // FIXME TO WORK
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
] as TestCase[];
