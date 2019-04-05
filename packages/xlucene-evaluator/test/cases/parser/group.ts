import { TestCase } from './interfaces';

export default [
    ['count:(>=10 AND <=20)', 'a field group expression with ranges', {
        type: 'term-set',
        field: 'count',
        nodes: [
            {
                type: 'range',
            }
        ]
    }],
] as TestCase[];
