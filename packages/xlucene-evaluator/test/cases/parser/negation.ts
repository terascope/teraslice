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
    ['foo:bar AND NOT name:Madman', 'simple AND NOT conjunction', {
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
    ['foo:bar OR NOT name:Madman', 'simple OR NOT conjunction', {
        type: 'logical-group',
        flow: [
            {
                type: 'conjunction',
                operator: 'OR',
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
    ['foo:bar OR !name:Madman', 'simple OR ! conjunction', {
        type: 'logical-group',
        flow: [
            {
                type: 'conjunction',
                operator: 'OR',
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
    ['a:1 AND !(b:1 OR c:1)', 'a parens negation conjunction', {
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
                        type: 'negation',
                        node: {
                            type: 'logical-group',
                            flow: [
                                {
                                    type: 'conjunction',
                                    operator: 'OR',
                                    nodes: [
                                        {
                                            type: 'term',
                                            field: 'b',
                                            value: 1,
                                        },
                                        {
                                            type: 'term',
                                            field: 'c',
                                            value: 1,
                                        },
                                    ]
                                }
                            ]
                        }
                    }
                ]
            }
        ]
    }],
] as TestCase[];
