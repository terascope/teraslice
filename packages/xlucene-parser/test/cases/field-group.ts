import { xLuceneFieldType } from '@terascope/types';
import { FieldGroup, NodeType, Term } from '../../src/index.js';
import { TestCase } from './interfaces.js';

export default [
    ['count:(>=10 AND <=20 AND >=100)', 'a field group expression with ranges', {
        type: NodeType.FieldGroup,
        field: 'count',
        flow: [
            {
                type: NodeType.Conjunction,
                nodes: [
                    {
                        type: NodeType.Range,
                        field: 'count',
                        left: {
                            operator: 'gte',
                            field_type: xLuceneFieldType.Integer,
                            value: { type: 'value', value: 10, },
                        }
                    },
                    {
                        type: NodeType.Range,
                        field: 'count',
                        left: {
                            operator: 'lte',
                            field_type: xLuceneFieldType.Integer,
                            value: { type: 'value', value: 20, },
                        }
                    },
                    {
                        type: NodeType.Range,
                        field: 'count',
                        left: {
                            operator: 'gte',
                            field_type: xLuceneFieldType.Integer,
                            value: { type: 'value', value: 100, },
                        }
                    }
                ]
            }
        ]
    }],
    ['count:(>=$foo AND <=$bar AND >=$baz)', 'a field group expression with ranges with variables', {
        type: NodeType.FieldGroup,
        field: 'count',
        flow: [
            {
                type: NodeType.Conjunction,
                nodes: [
                    {
                        type: NodeType.Range,
                        field: 'count',
                        left: {
                            operator: 'gte',
                            field_type: xLuceneFieldType.Integer,
                            value: { type: 'variable', value: 'foo', },
                        }
                    },
                    {
                        type: NodeType.Range,
                        field: 'count',
                        left: {
                            operator: 'lte',
                            field_type: xLuceneFieldType.Integer,
                            value: { type: 'variable', value: 'bar', },
                        }
                    },
                    {
                        type: NodeType.Range,
                        field: 'count',
                        left: {
                            operator: 'gte',
                            field_type: xLuceneFieldType.Integer,
                            value: { type: 'variable', value: 'baz', },
                        }
                    }
                ]
            }
        ]
    }, { count: xLuceneFieldType.Integer }],
    ['count:(>=10 OR <=20 OR >=100)', 'a chained OR field group expression with ranges', {
        type: NodeType.FieldGroup,
        field: 'count',
        flow: [
            {
                type: NodeType.Conjunction,
                nodes: [
                    {
                        type: NodeType.Range,
                        field: 'count',
                        left: {
                            operator: 'gte',
                            field_type: xLuceneFieldType.Integer,
                            value: { type: 'value', value: 10, },
                        }
                    },
                ]
            },
            {
                type: NodeType.Conjunction,
                nodes: [
                    {
                        type: NodeType.Range,
                        field: 'count',
                        left: {
                            operator: 'lte',
                            field_type: xLuceneFieldType.Integer,
                            value: { type: 'value', value: 20, },
                        }
                    },
                ]
            },
            {
                type: NodeType.Conjunction,
                nodes: [
                    {
                        type: NodeType.Range,
                        field: 'count',
                        left: {
                            operator: 'gte',
                            field_type: xLuceneFieldType.Integer,
                            value: { type: 'value', value: 100, },
                        }
                    }
                ]
            }
        ]
    }],
    ['id: (AqMvPMCS76u0 OR 497qIZuha9_u OR Oc2DG0O2gbcY)', 'chained ORs with restricted strings', {
        type: NodeType.FieldGroup,
        field: 'id',
        flow: [
            {
                type: NodeType.Conjunction,
                nodes: [
                    {
                        type: NodeType.Term,
                        field_type: xLuceneFieldType.String,
                        value: { type: 'value', value: 'AqMvPMCS76u0', },
                    }
                ]
            },
            {
                type: NodeType.Conjunction,
                nodes: [
                    {
                        type: NodeType.Term,
                        field_type: xLuceneFieldType.String,
                        value: { type: 'value', value: '497qIZuha9_u', },
                    }
                ]
            },
            {
                type: NodeType.Conjunction,
                nodes: [
                    {
                        type: NodeType.Term,
                        field_type: xLuceneFieldType.String,
                        value: { type: 'value', value: 'Oc2DG0O2gbcY', },
                    }
                ]
            }
        ]
    }],
    ['name:(Bob* OR Joe*)', 'chained ORs with wildcards', {
        type: NodeType.FieldGroup,
        field: 'name',
        flow: [
            {
                type: NodeType.Conjunction,
                nodes: [
                    {
                        type: NodeType.Wildcard,
                        value: { type: 'value', value: 'Bob*', },
                    }
                ]
            },
            {
                type: NodeType.Conjunction,
                nodes: [
                    {
                        type: NodeType.Wildcard,
                        value: { type: 'value', value: 'Joe*', },
                    }
                ]
            },
        ]
    }],
    ['count:(155 "223")', 'implicit OR grouping', {
        type: NodeType.FieldGroup,
        field: 'count',
        flow: [
            {
                type: NodeType.Conjunction,
                nodes: [
                    {
                        type: NodeType.Term,
                        field: 'count',
                        field_type: xLuceneFieldType.Integer,
                        value: { type: 'value', value: 155 },
                    },
                ]
            },
            {
                type: NodeType.Conjunction,
                nodes: [
                    {
                        type: NodeType.Term,
                        field: 'count',
                        field_type: xLuceneFieldType.String,
                        quoted: true,
                        value: { type: 'value', value: '223' },
                    }
                ]
            }
        ]
    }],
    ['count:($foo $bar)', 'implicit OR grouping with variables', {
        type: NodeType.FieldGroup,
        field: 'count',
        flow: [
            {
                type: NodeType.Conjunction,
                nodes: [
                    {
                        type: NodeType.Term,
                        field: 'count',
                        field_type: xLuceneFieldType.Integer,
                        value: { type: 'variable', value: 'foo' },
                    },
                ]
            },
            {
                type: NodeType.Conjunction,
                nodes: [
                    {
                        type: NodeType.Term,
                        field: 'count',
                        field_type: xLuceneFieldType.Integer,
                        value: { type: 'variable', value: 'bar' },
                    }
                ]
            }
        ]
    }, { count: xLuceneFieldType.Integer }],
    [
        'count:(155 OR "223")',
        'OR grouping with quoted and unquoted integers',
        {
            type: NodeType.FieldGroup,
            field: 'count',
            flow: [
                {
                    type: NodeType.Conjunction,
                    nodes: [
                        {
                            type: NodeType.Term,
                            field: 'count',
                            field_type: xLuceneFieldType.Integer,
                            value: { type: 'value', value: 155 },
                        },
                    ]
                },
                {
                    type: NodeType.Conjunction,
                    nodes: [
                        {
                            type: NodeType.Term,
                            field: 'count',
                            field_type: xLuceneFieldType.Integer,
                            value: { type: 'value', value: 223 },
                        }
                    ]
                }
            ]
        },
        {
            count: xLuceneFieldType.Integer
        }
    ],
    [
        'count:($foo OR $bar)',
        'OR grouping with quoted and unquoted integers with variables',
        {
            type: NodeType.FieldGroup,
            field: 'count',
            flow: [
                {
                    type: NodeType.Conjunction,
                    nodes: [
                        {
                            type: NodeType.Term,
                            field: 'count',
                            field_type: xLuceneFieldType.Integer,
                            value: { type: 'variable', value: 'foo' },
                        },
                    ]
                },
                {
                    type: NodeType.Conjunction,
                    nodes: [
                        {
                            type: NodeType.Term,
                            field: 'count',
                            field_type: xLuceneFieldType.Integer,
                            value: { type: 'variable', value: 'bar' },
                        }
                    ]
                }
            ]
        },
        {
            count: xLuceneFieldType.Integer
        },
    ],
    [
        'bool:(true OR "false")',
        'OR grouping with quoted and unquoted booleans',
        {
            type: NodeType.FieldGroup,
            field: 'bool',
            flow: [
                {
                    type: NodeType.Conjunction,
                    nodes: [
                        {
                            type: NodeType.Term,
                            field: 'bool',
                            field_type: xLuceneFieldType.Boolean,
                            value: { type: 'value', value: true },
                        },
                    ]
                },
                {
                    type: NodeType.Conjunction,
                    nodes: [
                        {
                            type: NodeType.Term,
                            field: 'bool',
                            field_type: xLuceneFieldType.Boolean,
                            value: { type: 'value', value: false },
                        }
                    ]
                }
            ]
        },
        {
            bool: xLuceneFieldType.Boolean
        }
    ],
    ['example:("foo" AND ("bar" OR "baz"))', 'implicit or grouping', {
        type: NodeType.FieldGroup,
        field: 'example',
        flow: [
            {
                type: NodeType.Conjunction,
                nodes: [
                    {
                        type: NodeType.Term,
                        field: 'example',
                        field_type: xLuceneFieldType.String,
                        value: { type: 'value', value: 'foo' },
                    },
                    {
                        type: NodeType.LogicalGroup,
                        flow: [
                            {
                                type: NodeType.Conjunction,
                                nodes: [
                                    {
                                        type: NodeType.Term,
                                        field: 'example',
                                        field_type: xLuceneFieldType.String,
                                        value: { type: 'value', value: 'bar' },
                                    },
                                ]
                            },
                            {
                                type: NodeType.Conjunction,
                                nodes: [
                                    {
                                        type: NodeType.Term,
                                        field: 'example',
                                        field_type: xLuceneFieldType.String,
                                        value: { type: 'value', value: 'baz' },
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
        type: NodeType.FieldGroup,
        field: 'example',
        flow: [
            {
                type: NodeType.Conjunction,
                nodes: [
                    {
                        type: NodeType.Term,
                        field_type: xLuceneFieldType.String,
                        field: 'example',
                        value: { type: 'value', value: 'foo' },
                    },
                    {
                        type: NodeType.Term,
                        field: 'other',
                        field_type: xLuceneFieldType.String,
                        value: { type: 'value', value: 'bar' },
                    },
                ]
            }
        ]
    }],
    ['val:(NOT 1 AND 2)', 'negated field group', {
        type: NodeType.FieldGroup,
        field: 'val',
        flow: [
            {
                type: NodeType.Conjunction,
                nodes: [
                    {
                        type: NodeType.Negation,
                        node: {
                            type: NodeType.Term,
                            field: 'val',
                            field_type: xLuceneFieldType.Integer,
                            value: { type: 'value', value: 1, },
                        }
                    },
                    {
                        type: NodeType.Term,
                        field: 'val',
                        field_type: xLuceneFieldType.Integer,
                        value: { type: 'value', value: 2 },
                    }
                ]
            }
        ]
    }],
    ['val:(NOT $foo AND $bar)', 'negated field group with variables', {
        type: NodeType.FieldGroup,
        field: 'val',
        flow: [
            {
                type: NodeType.Conjunction,
                nodes: [
                    {
                        type: NodeType.Negation,
                        node: {
                            type: NodeType.Term,
                            field: 'val',
                            field_type: xLuceneFieldType.Integer,
                            value: { type: 'variable', value: 'foo', },
                        }
                    },
                    {
                        type: NodeType.Term,
                        field: 'val',
                        field_type: xLuceneFieldType.Integer,
                        value: { type: 'variable', value: 'bar' },
                    }
                ]
            }
        ]
    }, { val: xLuceneFieldType.Integer }],
    ['some_ref:("A")', 'single value field group', {
        type: NodeType.Term,
        field_type: xLuceneFieldType.String,
        field: 'some_ref',
        quoted: true,
        value: { type: 'value', value: 'A', },
    }],
    ["some_ref:('A')", 'single value field group', {
        type: NodeType.Term,
        field_type: xLuceneFieldType.String,
        field: 'some_ref',
        quoted: true,
        value: { type: 'value', value: 'A', },
    }],
    ['foo:(bar baz)', 'multi-value field group with no quotes', {
        type: NodeType.FieldGroup,
        field: 'foo',
        flow: [
            {
                type: NodeType.Conjunction,
                nodes: [
                    {
                        type: NodeType.Term,
                        field: 'foo',
                        field_type: xLuceneFieldType.String,
                        value: { type: 'value', value: 'bar', },
                    },
                ],
            },
            {
                type: NodeType.Conjunction,
                nodes: [
                    {
                        type: NodeType.Term,
                        field: 'foo',
                        field_type: xLuceneFieldType.String,
                        value: { type: 'value', value: 'baz' },
                    }
                ]
            }
        ]
    }],
    ['foo:(@bar OR @baz)', 'multi-value field group with no quotes and @', {
        type: NodeType.FieldGroup,
        field: 'foo',
        flow: [
            {
                type: NodeType.Conjunction,
                nodes: [
                    {
                        type: NodeType.Term,
                        field: 'foo',
                        field_type: xLuceneFieldType.String,
                        value: { type: 'variable', scoped: true, value: '@bar', },
                    } as Term,
                ],
            },
            {
                type: NodeType.Conjunction,
                nodes: [
                    {
                        type: NodeType.Term,
                        field: 'foo',
                        field_type: xLuceneFieldType.String,
                        value: { type: 'variable', scoped: true, value: '@baz' },
                    } as Term
                ]
            }
        ]
    } as Partial<FieldGroup>, {
        foo: xLuceneFieldType.String,
    }],
    [
        'val:(155 223)',
        'a field with parens unquoted integers',
        {
            type: NodeType.FieldGroup,
            field: 'val',
            flow: [
                {
                    type: NodeType.Conjunction,
                    nodes: [
                        {
                            type: NodeType.Term,
                            field: 'val',
                            field_type: xLuceneFieldType.Integer,
                            value: { type: 'value', value: 155, },
                        },
                    ],
                },
                {
                    type: NodeType.Conjunction,
                    nodes: [
                        {
                            type: NodeType.Term,
                            field: 'val',
                            field_type: xLuceneFieldType.Integer,
                            value: { type: 'value', value: 223 },
                        }
                    ]
                }
            ]
        },
    ],
] as TestCase[];
