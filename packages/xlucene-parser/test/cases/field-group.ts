import { xLuceneFieldType } from '@terascope/types';
import { ASTType } from '../../src';
import { TestCase } from './interfaces';

export default [
    ['count:(>=10 AND <=20 AND >=100)', 'a field group expression with ranges', {
        type: ASTType.FieldGroup,
        field: 'count',
        flow: [
            {
                type: ASTType.Conjunction,
                nodes: [
                    {
                        type: ASTType.Range,
                        field: 'count',
                        left: {
                            operator: 'gte',
                            field_type: xLuceneFieldType.Integer,
                            value: 10,
                        }
                    },
                    {
                        type: ASTType.Range,
                        field: 'count',
                        left: {
                            operator: 'lte',
                            field_type: xLuceneFieldType.Integer,
                            value: 20,
                        }
                    },
                    {
                        type: ASTType.Range,
                        field: 'count',
                        left: {
                            operator: 'gte',
                            field_type: xLuceneFieldType.Integer,
                            value: 100,
                        }
                    }
                ]
            }
        ]
    }],
    ['count:(>=$foo AND <=$bar AND >=$baz)', 'a field group expression with ranges with variables', {
        type: ASTType.FieldGroup,
        field: 'count',
        flow: [
            {
                type: ASTType.Conjunction,
                nodes: [
                    {
                        type: ASTType.Range,
                        field: 'count',
                        left: {
                            operator: 'gte',
                            field_type: xLuceneFieldType.Integer,
                            value: 10,
                        }
                    },
                    {
                        type: ASTType.Range,
                        field: 'count',
                        left: {
                            operator: 'lte',
                            field_type: xLuceneFieldType.Integer,
                            value: 20,
                        }
                    },
                    {
                        type: ASTType.Range,
                        field: 'count',
                        left: {
                            operator: 'gte',
                            field_type: xLuceneFieldType.Integer,
                            value: 100,
                        }
                    }
                ]
            }
        ]
    }, { count: xLuceneFieldType.Integer }, { foo: 10, bar: 20, baz: 100 }],
    ['count:(>=10 OR <=20 OR >=100)', 'a chained OR field group expression with ranges', {
        type: ASTType.FieldGroup,
        field: 'count',
        flow: [
            {
                type: ASTType.Conjunction,
                nodes: [
                    {
                        type: ASTType.Range,
                        field: 'count',
                        left: {
                            operator: 'gte',
                            field_type: xLuceneFieldType.Integer,
                            value: 10,
                        }
                    },
                ]
            },
            {
                type: ASTType.Conjunction,
                nodes: [
                    {
                        type: ASTType.Range,
                        field: 'count',
                        left: {
                            operator: 'lte',
                            field_type: xLuceneFieldType.Integer,
                            value: 20,
                        }
                    },
                ]
            },
            {
                type: ASTType.Conjunction,
                nodes: [
                    {
                        type: ASTType.Range,
                        field: 'count',
                        left: {
                            operator: 'gte',
                            field_type: xLuceneFieldType.Integer,
                            value: 100,
                        }
                    }
                ]
            }
        ]
    }],
    ['id: (AqMvPMCS76u0 OR 497qIZuha9_u OR Oc2DG0O2gbcY)', 'chained ORs with restricted strings', {
        type: ASTType.FieldGroup,
        field: 'id',
        flow: [
            {
                type: ASTType.Conjunction,
                nodes: [
                    {
                        type: ASTType.Term,
                        field_type: xLuceneFieldType.String,
                        value: 'AqMvPMCS76u0',
                    }
                ]
            },
            {
                type: ASTType.Conjunction,
                nodes: [
                    {
                        type: ASTType.Term,
                        field_type: xLuceneFieldType.String,
                        value: '497qIZuha9_u',
                    }
                ]
            },
            {
                type: ASTType.Conjunction,
                nodes: [
                    {
                        type: ASTType.Term,
                        field_type: xLuceneFieldType.String,
                        value: 'Oc2DG0O2gbcY',
                    }
                ]
            }
        ]
    }],
    ['name:(Bob* OR Joe*)', 'chained ORs with wildcards', {
        type: ASTType.FieldGroup,
        field: 'name',
        flow: [
            {
                type: ASTType.Conjunction,
                nodes: [
                    {
                        type: ASTType.Wildcard,
                        value: 'Bob*',
                    }
                ]
            },
            {
                type: ASTType.Conjunction,
                nodes: [
                    {
                        type: ASTType.Wildcard,
                        value: 'Joe*',
                    }
                ]
            },
        ]
    }],
    ['count:(155 "223")', 'implicit OR grouping', {
        type: ASTType.FieldGroup,
        field: 'count',
        flow: [
            {
                type: ASTType.Conjunction,
                nodes: [
                    {
                        type: ASTType.Term,
                        field: 'count',
                        field_type: xLuceneFieldType.Integer,
                        value: 155
                    },
                ]
            },
            {
                type: ASTType.Conjunction,
                nodes: [
                    {
                        type: ASTType.Term,
                        field: 'count',
                        field_type: xLuceneFieldType.String,
                        quoted: true,
                        value: '223'
                    }
                ]
            }
        ]
    }],
    ['count:($foo $bar)', 'implicit OR grouping with variables', {
        type: ASTType.FieldGroup,
        field: 'count',
        flow: [
            {
                type: ASTType.Conjunction,
                nodes: [
                    {
                        type: ASTType.Term,
                        field: 'count',
                        field_type: xLuceneFieldType.Integer,
                        value: 155
                    },
                ]
            },
            {
                type: ASTType.Conjunction,
                nodes: [
                    {
                        type: ASTType.Term,
                        field: 'count',
                        field_type: xLuceneFieldType.Integer,
                        value: 223
                    }
                ]
            }
        ]
    }, { count: xLuceneFieldType.Integer }, { foo: 155, bar: 223 }],
    [
        'count:(155 OR "223")',
        'OR grouping with quoted and unquoted integers',
        {
            type: ASTType.FieldGroup,
            field: 'count',
            flow: [
                {
                    type: ASTType.Conjunction,
                    nodes: [
                        {
                            type: ASTType.Term,
                            field: 'count',
                            field_type: xLuceneFieldType.Integer,
                            value: 155
                        },
                    ]
                },
                {
                    type: ASTType.Conjunction,
                    nodes: [
                        {
                            type: ASTType.Term,
                            field: 'count',
                            field_type: xLuceneFieldType.Integer,
                            value: 223
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
            type: ASTType.FieldGroup,
            field: 'count',
            flow: [
                {
                    type: ASTType.Conjunction,
                    nodes: [
                        {
                            type: ASTType.Term,
                            field: 'count',
                            field_type: xLuceneFieldType.Integer,
                            value: 155
                        },
                    ]
                },
                {
                    type: ASTType.Conjunction,
                    nodes: [
                        {
                            type: ASTType.Term,
                            field: 'count',
                            field_type: xLuceneFieldType.Integer,
                            value: 223
                        }
                    ]
                }
            ]
        },
        {
            count: xLuceneFieldType.Integer
        },
        { foo: 155, bar: 223 }
    ],
    [
        'bool:(true OR "false")',
        'OR grouping with quoted and unquoted booleans',
        {
            type: ASTType.FieldGroup,
            field: 'bool',
            flow: [
                {
                    type: ASTType.Conjunction,
                    nodes: [
                        {
                            type: ASTType.Term,
                            field: 'bool',
                            field_type: xLuceneFieldType.Boolean,
                            value: true
                        },
                    ]
                },
                {
                    type: ASTType.Conjunction,
                    nodes: [
                        {
                            type: ASTType.Term,
                            field: 'bool',
                            field_type: xLuceneFieldType.Boolean,
                            value: false
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
        type: ASTType.FieldGroup,
        field: 'example',
        flow: [
            {
                type: ASTType.Conjunction,
                nodes: [
                    {
                        type: ASTType.Term,
                        field: 'example',
                        field_type: xLuceneFieldType.String,
                        value: 'foo'
                    },
                    {
                        type: ASTType.LogicalGroup,
                        flow: [
                            {
                                type: ASTType.Conjunction,
                                nodes: [
                                    {
                                        type: ASTType.Term,
                                        field: 'example',
                                        field_type: xLuceneFieldType.String,
                                        value: 'bar'
                                    },
                                ]
                            },
                            {
                                type: ASTType.Conjunction,
                                nodes: [
                                    {
                                        type: ASTType.Term,
                                        field: 'example',
                                        field_type: xLuceneFieldType.String,
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
        type: ASTType.FieldGroup,
        field: 'example',
        flow: [
            {
                type: ASTType.Conjunction,
                nodes: [
                    {
                        type: ASTType.Term,
                        field_type: xLuceneFieldType.String,
                        field: 'example',
                        value: 'foo'
                    },
                    {
                        type: ASTType.Term,
                        field: 'other',
                        field_type: xLuceneFieldType.String,
                        value: 'bar'
                    },
                ]
            }
        ]
    }],
    ['val:(NOT 1 AND 2)', 'negated field group', {
        type: ASTType.FieldGroup,
        field: 'val',
        flow: [
            {
                type: ASTType.Conjunction,
                nodes: [
                    {
                        type: ASTType.Negation,
                        node: {
                            type: ASTType.Term,
                            field: 'val',
                            field_type: xLuceneFieldType.Integer,
                            value: 1,
                        }
                    },
                    {
                        type: ASTType.Term,
                        field: 'val',
                        field_type: xLuceneFieldType.Integer,
                        value: 2
                    }
                ]
            }
        ]
    }],
    ['val:(NOT $foo AND $bar)', 'negated field group with variables', {
        type: ASTType.FieldGroup,
        field: 'val',
        flow: [
            {
                type: ASTType.Conjunction,
                nodes: [
                    {
                        type: ASTType.Negation,
                        node: {
                            type: ASTType.Term,
                            field: 'val',
                            field_type: xLuceneFieldType.Integer,
                            value: 1,
                        }
                    },
                    {
                        type: ASTType.Term,
                        field: 'val',
                        field_type: xLuceneFieldType.Integer,
                        value: 2
                    }
                ]
            }
        ]
    }, { val: xLuceneFieldType.Integer }, { foo: 1, bar: 2 }],
    ['some_ref:("A")', 'single value field group', {
        type: ASTType.Term,
        field_type: xLuceneFieldType.String,
        field: 'some_ref',
        quoted: true,
        value: 'A',
    }],
    ["some_ref:('A')", 'single value field group', {
        type: ASTType.Term,
        field_type: xLuceneFieldType.String,
        field: 'some_ref',
        quoted: true,
        value: 'A',
    }],
    ['foo:(bar baz)', 'multi-value field group with no quotes', {
        type: ASTType.FieldGroup,
        field: 'foo',
        flow: [
            {
                type: ASTType.Conjunction,
                nodes: [
                    {
                        type: ASTType.Term,
                        field: 'foo',
                        field_type: xLuceneFieldType.String,
                        value: 'bar',
                    },
                ],
            },
            {
                type: ASTType.Conjunction,
                nodes: [
                    {
                        type: ASTType.Term,
                        field: 'foo',
                        field_type: xLuceneFieldType.String,
                        value: 'baz'
                    }
                ]
            }
        ]
    }],
    ['foo:(@bar OR @baz)', 'multi-value field group with no quotes and @', {
        type: ASTType.FieldGroup,
        field: 'foo',
        flow: [
            {
                type: ASTType.Conjunction,
                nodes: [
                    {
                        type: ASTType.Term,
                        field: 'foo',
                        field_type: xLuceneFieldType.String,
                        quoted: false,
                        restricted: true,
                        value: '@bar',
                    },
                ],
            },
            {
                type: ASTType.Conjunction,
                nodes: [
                    {
                        type: ASTType.Term,
                        field: 'foo',
                        field_type: xLuceneFieldType.String,
                        quoted: false,
                        restricted: true,
                        value: '@baz'
                    }
                ]
            }
        ]
    }],
    [
        'val:(155 223)',
        'a field with parens unquoted integers',
        {
            type: ASTType.FieldGroup,
            field: 'val',
            flow: [
                {
                    type: ASTType.Conjunction,
                    nodes: [
                        {
                            type: ASTType.Term,
                            field: 'val',
                            field_type: xLuceneFieldType.Integer,
                            value: 155,
                        },
                    ],
                },
                {
                    type: ASTType.Conjunction,
                    nodes: [
                        {
                            type: ASTType.Term,
                            field: 'val',
                            field_type: xLuceneFieldType.Integer,
                            value: 223
                        }
                    ]
                }
            ]
        },
    ],
] as TestCase[];
