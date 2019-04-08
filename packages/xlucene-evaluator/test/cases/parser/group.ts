import { TestCase } from './interfaces';

export default [
    ['count:(>=10 AND <=20 AND >=100)', 'a field group expression with ranges', {
        type: 'field-group',
        field: 'count',
        flow: [
            {
                type: 'conjunction',
                operator: 'AND',
                nodes: [
                    {
                        type: 'range',
                        left: {
                            operator: 'gte',
                            data_type: 'integer',
                            value: 10,
                        }
                    },
                    {
                        type: 'range',
                        left: {
                            operator: 'lte',
                            data_type: 'integer',
                            value: 20,
                        }
                    },
                    {
                        type: 'range',
                        left: {
                            operator: 'gte',
                            data_type: 'integer',
                            value: 100,
                        }
                    }
                ]
            }
        ]
    }],
    ['count:(>=10 OR <=20 OR >=100)', 'a chained OR field group expression with ranges', {
        type: 'field-group',
        field: 'count',
        flow: [
            {
                type: 'conjunction',
                operator: 'OR',
                nodes: [
                    {
                        type: 'range',
                        left: {
                            operator: 'gte',
                            data_type: 'integer',
                            value: 10,
                        }
                    },
                    {
                        type: 'range',
                        left: {
                            operator: 'lte',
                            data_type: 'integer',
                            value: 20,
                        }
                    },
                    {
                        type: 'range',
                        left: {
                            operator: 'gte',
                            data_type: 'integer',
                            value: 100,
                        }
                    }
                ]
            }
        ]
    }],
    ['count:(155 "223")', 'implicit or grouping', {
        type: 'field-group',
        field: 'count',
        flow: [
            {
                type: 'conjunction',
                operator: 'OR',
                nodes: [
                    {
                        type: 'term',
                        data_type: 'integer',
                        value: 155
                    },
                    {
                        type: 'term',
                        data_type: 'string',
                        quoted: true,
                        value: '223'
                    }
                ]
            }
        ]
    }],
    ['example:("foo" AND ("bar" OR "baz"))', 'implicit or grouping', {
        type: 'field-group',
        field: 'example',
        flow: [
            {
                type: 'conjunction',
                operator: 'AND',
                nodes: [
                    {
                        type: 'term',
                        data_type: 'string',
                        value: 'foo'
                    },
                    {
                        type: 'logical-group',
                        flow: [
                            {
                                type: 'conjunction',
                                operator: 'OR',
                                nodes: [
                                    {
                                        type: 'term',
                                        data_type: 'string',
                                        value: 'bar'
                                    },
                                    {
                                        type: 'term',
                                        data_type: 'string',
                                        value: 'baz'
                                    },
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    }],
    ['example:("foo" AND other:"bar")', 'implicit or grouping', {
        type: 'field-group',
        field: 'example',
        flow: [
            {
                type: 'conjunction',
                operator: 'AND',
                nodes: [
                    {
                        type: 'term',
                        data_type: 'string',
                        value: 'foo'
                    },
                    {
                        type: 'term',
                        field: 'other',
                        data_type: 'string',
                        value: 'bar'
                    },
                ]
            }
        ]
    }],
    ['val:(NOT 1 AND 2)', 'negated field group', {
        type: 'field-group',
        field: 'val',
        flow: [
            {
                type: 'conjunction',
                operator: 'AND',
                nodes: [
                    {
                        type: 'negation',
                        node: {
                            type: 'term',
                            data_type: 'integer',
                            value: 1,
                        }
                    },
                    {
                        type: 'term',
                        data_type: 'integer',
                        value: 2
                    }
                ]
            }
        ]
    }],
] as TestCase[];
