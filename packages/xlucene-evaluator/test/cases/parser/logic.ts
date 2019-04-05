import { TestCase } from './interfaces';

export default [
    ['a:1 AND b:1', 'a simple AND conjunction', {
        type: 'logical-group',
        flow: [
            {
                type: 'conjunction',
                operator: 'AND',
                nodes: [
                    {
                        type: 'term',
                        field: 'a',
                        value: 1,
                    },
                    {
                        type: 'term',
                        field: 'b',
                        value: 1,
                    }
                ]
            }
        ]
    }],
    ['a:1 OR b:1', 'a simple OR conjunction', {
        type: 'logical-group',
        flow: [
            {
                type: 'conjunction',
                operator: 'OR',
                nodes: [
                    {
                        type: 'term',
                        field: 'a',
                        value: 1,
                    },
                    {
                        type: 'term',
                        field: 'b',
                        value: 1,
                    }
                ]
            }
        ],
    }],
    ['a:1 OR b:1 OR c:1', 'a chained OR conjunction', {
        type: 'logical-group',
        flow: [
            {
                type: 'conjunction',
                operator: 'OR',
                nodes: [
                    {
                        type: 'term',
                        field: 'a',
                        value: 1,
                    },
                    {
                        type: 'term',
                        field: 'b',
                        value: 1,
                    },
                    {
                        type: 'term',
                        field: 'c',
                        value: 1,
                    }
                ]
            }
        ],
    }],
    ['a:1 AND b:1 AND c:1', 'a double chained AND conjunction', {
        type: 'logical-group',
        flow: [
            {
                type: 'conjunction',
                operator: 'AND',
                nodes: [
                    {
                        type: 'term',
                        field: 'a',
                        value: 1,
                    },
                    {
                        type: 'term',
                        field: 'b',
                        value: 1,
                    },
                    {
                        type: 'term',
                        field: 'c',
                        value: 1,
                    }
                ]
            }
        ]
    }],
    ['a:1 OR b:1 OR c:1 AND d:1 AND e:1', 'a chained AND/OR conjunctions', {
        type: 'logical-group',
        flow: [
            {
                type: 'conjunction',
                operator: 'OR',
                nodes: [
                    {
                        type: 'term',
                        field: 'a',
                        value: 1,
                    },
                    {
                        type: 'term',
                        field: 'b',
                        value: 1,
                    },
                    {
                        type: 'term',
                        field: 'c',
                        value: 1,
                    }
                ]
            },
            {
                type: 'conjunction',
                operator: 'AND',
                nodes: [
                    {
                        type: 'term',
                        field: 'd',
                        value: 1,
                    },
                    {
                        type: 'term',
                        field: 'e',
                        value: 1,
                    },
                ]
            }
        ]
    }]

] as TestCase[];
