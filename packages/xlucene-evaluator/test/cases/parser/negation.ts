import { TestCase } from './interfaces';

export default [
    ['NOT name:Madman', 'negate a single field/value', {
        type: 'negation',
        node: {
            type: 'term',
            data_type: 'string',
            field: 'name',
            value: 'Madman'
        }
    }],
    ['!name:Madman', 'negate a single field/value', {
        type: 'negation',
        node: {
            type: 'term',
            data_type: 'string',
            field: 'name',
            value: 'Madman'
        }
    }],
    ['foo:bar NOT name:Madman', 'simple NOT conjunction', {
        type: 'logical-group',
        flow: [
            {
                type: 'conjunction',
                operator: 'AND',
                nodes: [
                    {
                        type: 'term',
                        field: 'foo',
                        value: 'bar',
                    },
                    {
                        type: 'negation',
                        node: {
                            type: 'term',
                            data_type: 'string',
                            field: 'name',
                            value: 'Madman'
                        }
                    }
                ]
            }
        ]
    }],
] as TestCase[];
