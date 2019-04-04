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
    }]
] as TestCase[];
