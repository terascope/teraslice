import { ASTType, FieldType } from '../../../src';
import { TestCase } from './interfaces';

export default [
    ['count:(>=10 AND <=20 AND >=100)', 'a field group expression with ranges', {
        type: 'field-group',
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
                            field_type: FieldType.Integer,
                            value: 10,
                        }
                    },
                    {
                        type: ASTType.Range,
                        field: 'count',
                        left: {
                            operator: 'lte',
                            field_type: FieldType.Integer,
                            value: 20,
                        }
                    },
                    {
                        type: ASTType.Range,
                        field: 'count',
                        left: {
                            operator: 'gte',
                            field_type: FieldType.Integer,
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
                type: ASTType.Conjunction,
                nodes: [
                    {
                        type: ASTType.Range,
                        field: 'count',
                        left: {
                            operator: 'gte',
                            field_type: FieldType.Integer,
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
                            field_type: FieldType.Integer,
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
                            field_type: FieldType.Integer,
                            value: 100,
                        }
                    }
                ]
            }
        ]
    }],
    ['id: (AqMvPMCS76u0 OR 497qIZuha9_u OR Oc2DG0O2gbcY)', 'chained ORs with restricted strings', {
        type: 'field-group',
        field: 'id',
        flow: [
            {
                type: ASTType.Conjunction,
                nodes: [
                    {
                        type: ASTType.Term,
                        field_type: FieldType.String,
                        value: 'AqMvPMCS76u0',
                    }
                ]
            },
            {
                type: ASTType.Conjunction,
                nodes: [
                    {
                        type: ASTType.Term,
                        field_type: FieldType.String,
                        value: '497qIZuha9_u',
                    }
                ]
            },
            {
                type: ASTType.Conjunction,
                nodes: [
                    {
                        type: ASTType.Term,
                        field_type: FieldType.String,
                        value: 'Oc2DG0O2gbcY',
                    }
                ]
            }
        ]
    }],
    ['name:(Bob* OR Joe*)', 'chained ORs with wildcards', {
        type: 'field-group',
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
        type: 'field-group',
        field: 'count',
        flow: [
            {
                type: ASTType.Conjunction,
                nodes: [
                    {
                        type: ASTType.Term,
                        field: 'count',
                        field_type: FieldType.Integer,
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
                        field_type: FieldType.String,
                        quoted: true,
                        value: '223'
                    }
                ]
            }
        ]
    }],
    [
        'count:(155 OR "223")',
        'OR grouping with quoted and unqouted integers',
        {
            type: 'field-group',
            field: 'count',
            flow: [
                {
                    type: ASTType.Conjunction,
                    nodes: [
                        {
                            type: ASTType.Term,
                            field: 'count',
                            field_type: FieldType.Integer,
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
                            field_type: FieldType.Integer,
                            value: 223
                        }
                    ]
                }
            ]
        },
        {
            count: FieldType.Integer
        }
    ],
    [
        'bool:(true OR "false")',
        'OR grouping with quoted and unqouted booleans',
        {
            type: 'field-group',
            field: 'bool',
            flow: [
                {
                    type: ASTType.Conjunction,
                    nodes: [
                        {
                            type: ASTType.Term,
                            field: 'bool',
                            field_type: FieldType.Boolean,
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
                            field_type: FieldType.Boolean,
                            value: false
                        }
                    ]
                }
            ]
        },
        {
            bool: FieldType.Boolean
        }
    ],
    ['example:("foo" AND ("bar" OR "baz"))', 'implicit or grouping', {
        type: 'field-group',
        field: 'example',
        flow: [
            {
                type: ASTType.Conjunction,
                nodes: [
                    {
                        type: ASTType.Term,
                        field: 'example',
                        field_type: FieldType.String,
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
                                        field_type: FieldType.String,
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
                                        field_type: FieldType.String,
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
                type: ASTType.Conjunction,
                nodes: [
                    {
                        type: ASTType.Term,
                        field_type: FieldType.String,
                        field: 'example',
                        value: 'foo'
                    },
                    {
                        type: ASTType.Term,
                        field: 'other',
                        field_type: FieldType.String,
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
                type: ASTType.Conjunction,
                nodes: [
                    {
                        type: ASTType.Negation,
                        node: {
                            type: ASTType.Term,
                            field: 'val',
                            field_type: FieldType.Integer,
                            value: 1,
                        }
                    },
                    {
                        type: ASTType.Term,
                        field: 'val',
                        field_type: FieldType.Integer,
                        value: 2
                    }
                ]
            }
        ]
    }],
    ['some_ref:("A")', 'single value field group',
        {
            type: ASTType.Term,
            field_type: FieldType.String,
            field: 'some_ref',
            quoted: true,
            value: 'A',
        }],
    ["some_ref:('A')", 'single value field group',
        {
            type: ASTType.Term,
            field_type: FieldType.String,
            field: 'some_ref',
            quoted: true,
            value: 'A',
        }],
] as TestCase[];
