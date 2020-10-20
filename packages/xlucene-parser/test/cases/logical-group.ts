import { xLuceneFieldType } from '@terascope/types';
import { ASTType } from '../../src';
import { TestCase } from './interfaces';

export default [
    [
        'a:1 AND b:1',
        'a simple AND conjunction',
        {
            type: ASTType.LogicalGroup,
            flow: [
                {
                    type: ASTType.Conjunction,
                    nodes: [
                        {
                            type: ASTType.Term,
                            field: 'a',
                            value: { type: 'value', value: 1, },
                        },
                        {
                            type: ASTType.Term,
                            field: 'b',
                            value: { type: 'value', value: 1, },
                        },
                    ],
                },
            ],
        },
    ],
    [
        'a:$foo AND b:$bar',
        'a simple AND conjunction with variables',
        {
            type: ASTType.LogicalGroup,
            flow: [
                {
                    type: ASTType.Conjunction,
                    nodes: [
                        {
                            type: ASTType.Term,
                            field: 'a',
                            value: { type: 'variable', value: 'foo', },
                        },
                        {
                            type: ASTType.Term,
                            field: 'b',
                            value: { type: 'variable', value: 'bar', },
                        },
                    ],
                },
            ],
        },
        { a: xLuceneFieldType.Integer, b: xLuceneFieldType.Integer },
        { foo: 1, bar: 1 }
    ],
    [
        '(a:1 AND b:1)',
        'a simple AND conjunction',
        {
            type: ASTType.LogicalGroup,
            flow: [
                {
                    type: ASTType.Conjunction,
                    nodes: [
                        {
                            type: ASTType.Term,
                            field: 'a',
                            value: { type: 'value', value: 1, },
                        },
                        {
                            type: ASTType.Term,
                            field: 'b',
                            value: { type: 'value', value: 1, },
                        },
                    ],
                },
            ],
        },
    ],
    [
        'a:1 && b:1',
        'a simple && conjunction',
        {
            type: ASTType.LogicalGroup,
            flow: [
                {
                    type: ASTType.Conjunction,
                    nodes: [
                        {
                            type: ASTType.Term,
                            field: 'a',
                            value: { type: 'value', value: 1, },
                        },
                        {
                            type: ASTType.Term,
                            field: 'b',
                            value: { type: 'value', value: 1, },
                        },
                    ],
                },
            ],
        },
    ],
    [
        'a:1 OR b:1',
        'a simple OR conjunction',
        {
            type: ASTType.LogicalGroup,
            flow: [
                {
                    type: ASTType.Conjunction,
                    nodes: [
                        {
                            type: ASTType.Term,
                            field: 'a',
                            value: { type: 'value', value: 1, },
                        },
                    ],
                },
                {
                    type: ASTType.Conjunction,
                    nodes: [
                        {
                            type: ASTType.Term,
                            field: 'b',
                            value: { type: 'value', value: 1, },
                        },
                    ],
                },
            ],
        },
    ],
    [
        'foo:$bar',
        'variable array substitution',
        {
            type: ASTType.Term,
            field: 'foo',
            value: { type: 'variable', value: 'bar', },
        },
        {
            foo: xLuceneFieldType.Integer
        },
        {
            bar: [1, 2, 3]
        }
    ],
    [
        '(a:1 OR b:1)',
        'a simple OR conjunction with top-level parens',
        {
            type: ASTType.LogicalGroup,
            flow: [
                {
                    type: ASTType.Conjunction,
                    nodes: [
                        {
                            type: ASTType.Term,
                            field: 'a',
                            value: { type: 'value', value: 1, },
                        },
                    ],
                },
                {
                    type: ASTType.Conjunction,
                    nodes: [
                        {
                            type: ASTType.Term,
                            field: 'b',
                            value: { type: 'value', value: 1, },
                        },
                    ],
                },
            ],
        },
    ],
    [
        'foo:"bar" fo?',
        'a implicit OR with wildcard',
        {
            type: ASTType.LogicalGroup,
            flow: [
                {
                    type: ASTType.Conjunction,
                    nodes: [
                        {
                            type: ASTType.Term,
                            field: 'foo',
                            value: { type: 'value', value: 'bar', },
                        },
                    ],
                },
                {
                    type: ASTType.Conjunction,
                    nodes: [
                        {
                            type: ASTType.Wildcard,
                            field: null,
                            value: { type: 'value', value: 'fo?', },
                        },
                    ],
                },
            ],
        },
    ],
    [
        'a:1 || b:1',
        'a simple || conjunction',
        {
            type: ASTType.LogicalGroup,
            flow: [
                {
                    type: ASTType.Conjunction,
                    nodes: [
                        {
                            type: ASTType.Term,
                            field: 'a',
                            value: { type: 'value', value: 1, },
                        },
                    ],
                },
                {
                    type: ASTType.Conjunction,
                    nodes: [
                        {
                            type: ASTType.Term,
                            field: 'b',
                            value: { type: 'value', value: 1, },
                        },
                    ],
                },
            ],
        },
    ],
    [
        'a:1 OR b:1 OR c:1',
        'a chained OR conjunction',
        {
            type: ASTType.LogicalGroup,
            flow: [
                {
                    type: ASTType.Conjunction,
                    nodes: [
                        {
                            type: ASTType.Term,
                            field: 'a',
                            value: { type: 'value', value: 1, },
                        },
                    ],
                },
                {
                    type: ASTType.Conjunction,
                    nodes: [
                        {
                            type: ASTType.Term,
                            field: 'b',
                            value: { type: 'value', value: 1, },
                        },
                    ],
                },
                {
                    type: ASTType.Conjunction,
                    nodes: [
                        {
                            type: ASTType.Term,
                            field: 'c',
                            value: { type: 'value', value: 1, },
                        },
                    ],
                },
            ],
        },
    ],
    [
        'a:1 AND b:1 AND c:1',
        'a double chained AND conjunction',
        {
            type: ASTType.LogicalGroup,
            flow: [
                {
                    type: ASTType.Conjunction,
                    nodes: [
                        {
                            type: ASTType.Term,
                            field: 'a',
                            value: { type: 'value', value: 1, },
                        },
                        {
                            type: ASTType.Term,
                            field: 'b',
                            value: { type: 'value', value: 1, },
                        },
                        {
                            type: ASTType.Term,
                            field: 'c',
                            value: { type: 'value', value: 1, },
                        },
                    ],
                },
            ],
        },
    ],
    [
        'AqMvPMCS76u0 OR foo',
        'OR with unquoted strings',
        {
            type: 'logical-group',
            flow: [
                {
                    type: ASTType.Conjunction,
                    nodes: [
                        {
                            type: ASTType.Term,
                            field_type: xLuceneFieldType.String,
                            value: { type: 'value', value: 'AqMvPMCS76u0', },
                        },
                    ],
                },
                {
                    type: ASTType.Conjunction,
                    nodes: [
                        {
                            type: ASTType.Term,
                            field_type: xLuceneFieldType.String,
                            value: { type: 'value', value: 'foo', },
                        },
                    ],
                },
            ],
        },
    ],
    [
        'a:1 OR b:1 OR c:1 AND d:1 AND e:1',
        'a chained AND/OR conjunctions',
        {
            type: ASTType.LogicalGroup,
            flow: [
                {
                    type: ASTType.Conjunction,
                    nodes: [
                        {
                            type: ASTType.Term,
                            field: 'a',
                            value: { type: 'value', value: 1, },
                        },
                    ],
                },
                {
                    type: ASTType.Conjunction,
                    nodes: [
                        {
                            type: ASTType.Term,
                            field: 'b',
                            value: { type: 'value', value: 1, },
                        },
                    ],
                },
                {
                    type: ASTType.Conjunction,
                    nodes: [
                        {
                            type: ASTType.Term,
                            field: 'c',
                            value: { type: 'value', value: 1, },
                        },
                        {
                            type: ASTType.Term,
                            field: 'd',
                            value: { type: 'value', value: 1, },
                        },
                        {
                            type: ASTType.Term,
                            field: 'e',
                            value: { type: 'value', value: 1, },
                        },
                    ],
                },
            ],
        },
    ],
    [
        'foo "bar"',
        'implicit OR conjunction',
        {
            type: ASTType.LogicalGroup,
            flow: [
                {
                    type: ASTType.Conjunction,
                    nodes: [
                        {
                            type: ASTType.Term,
                            field_type: xLuceneFieldType.String,
                            restricted: true,
                            field: null,
                            value: { type: 'value', value: 'foo', },
                        },
                    ],
                },
                {
                    type: ASTType.Conjunction,
                    nodes: [
                        {
                            type: ASTType.Term,
                            field_type: xLuceneFieldType.String,
                            field: null,
                            quoted: true,
                            value: { type: 'value', value: 'bar', },
                        },
                    ],
                },
            ],
        },
    ],
    [
        '"foo" bar:baz',
        'implicit OR conjunction',
        {
            type: ASTType.LogicalGroup,
            flow: [
                {
                    type: ASTType.Conjunction,
                    nodes: [
                        {
                            type: ASTType.Term,
                            field_type: xLuceneFieldType.String,
                            field: null,
                            quoted: true,
                            value: { type: 'value', value: 'foo', },
                        },
                    ],
                },
                {
                    type: ASTType.Conjunction,
                    nodes: [
                        {
                            type: ASTType.Term,
                            field_type: xLuceneFieldType.String,
                            field: 'bar',
                            value: { type: 'value', value: 'baz', },
                        },
                    ],
                },
            ],
        },
    ],
    [
        'hi:"foo" hello:"bar"',
        'implicit OR conjunction',
        {
            type: ASTType.LogicalGroup,
            flow: [
                {
                    type: ASTType.Conjunction,
                    nodes: [
                        {
                            type: ASTType.Term,
                            field_type: xLuceneFieldType.String,
                            field: 'hi',
                            quoted: true,
                            value: { type: 'value', value: 'foo', },
                        },
                    ],
                },
                {
                    type: ASTType.Conjunction,
                    nodes: [
                        {
                            type: ASTType.Term,
                            field_type: xLuceneFieldType.String,
                            field: 'hello',
                            quoted: true,
                            value: { type: 'value', value: 'bar', },
                        },
                    ],
                },
            ],
        },
    ],
    [
        ' foo:   bar baz',
        'field and space between multiple values into a conjunction',
        {
            type: ASTType.LogicalGroup,
            flow: [
                {
                    type: ASTType.Conjunction,
                    nodes: [
                        {
                            type: ASTType.Term,
                            field_type: xLuceneFieldType.String,
                            field: 'foo',
                            quoted: false,
                            value: { type: 'value', value: 'bar', },
                        },
                    ],
                },
                {
                    type: ASTType.Conjunction,
                    nodes: [
                        {
                            type: ASTType.Term,
                            field_type: xLuceneFieldType.String,
                            field: null,
                            quoted: false,
                            value: { type: 'value', value: 'baz', },
                        },
                    ],
                },
            ],
        },
    ],
    [
        'a:1 AND (b:1 OR c:1) AND d:1',
        'AND/OR conjunction with parens',
        {
            type: ASTType.LogicalGroup,
            flow: [
                {
                    type: ASTType.Conjunction,
                    nodes: [
                        {
                            type: ASTType.Term,
                            field: 'a',
                            value: { type: 'value', value: 1, },
                        },
                        {
                            type: ASTType.LogicalGroup,
                            flow: [
                                {
                                    type: ASTType.Conjunction,
                                    nodes: [
                                        {
                                            type: ASTType.Term,
                                            field: 'b',
                                            value: { type: 'value', value: 1, },
                                        },
                                    ],
                                },
                                {
                                    type: ASTType.Conjunction,
                                    nodes: [
                                        {
                                            type: ASTType.Term,
                                            field: 'c',
                                            value: { type: 'value', value: 1, },
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            type: ASTType.Term,
                            field: 'd',
                            value: { type: 'value', value: 1, },
                        },
                    ],
                },
            ],
        },
    ],
    [
        '(a:1 OR b:1) AND (c:1 OR d:1)',
        'AND/OR conjunction with two parens',
        {
            type: ASTType.LogicalGroup,
            flow: [
                {
                    type: ASTType.Conjunction,
                    nodes: [
                        {
                            type: ASTType.LogicalGroup,
                            flow: [
                                {
                                    type: ASTType.Conjunction,
                                    nodes: [
                                        {
                                            field_type: xLuceneFieldType.Integer,
                                            field: 'a',
                                            value: { type: 'value', value: 1, },
                                        },
                                    ],
                                },
                                {
                                    type: ASTType.Conjunction,
                                    nodes: [
                                        {
                                            field_type: xLuceneFieldType.Integer,
                                            field: 'b',
                                            value: { type: 'value', value: 1, },
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            type: ASTType.LogicalGroup,
                            flow: [
                                {
                                    type: ASTType.Conjunction,
                                    nodes: [
                                        {
                                            field_type: xLuceneFieldType.Integer,
                                            field: 'c',
                                            value: { type: 'value', value: 1, },
                                        },
                                    ],
                                },
                                {
                                    type: ASTType.Conjunction,
                                    nodes: [
                                        {
                                            field_type: xLuceneFieldType.Integer,
                                            field: 'd',
                                            value: { type: 'value', value: 1, },
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
        },
    ],
    [
        '(a:1) AND (b:1)',
        'a simple AND with parens conjunction',
        {
            type: ASTType.LogicalGroup,
            flow: [
                {
                    type: ASTType.Conjunction,
                    nodes: [
                        {
                            type: ASTType.Term,
                            field: 'a',
                            value: { type: 'value', value: 1, },
                        },
                        {
                            type: ASTType.Term,
                            field: 'b',
                            value: { type: 'value', value: 1, },
                        },
                    ],
                },
            ],
        },
    ],
    [
        '((field: value OR field2:value))',
        'double parens expression',
        {
            type: ASTType.LogicalGroup,
            flow: [
                {
                    type: ASTType.Conjunction,
                    nodes: [
                        {
                            type: ASTType.Term,
                            field_type: xLuceneFieldType.String,
                            restricted: true,
                            quoted: false,
                            value: { type: 'value', value: 'value', },
                            field: 'field'
                        }
                    ]
                },
                {
                    type: ASTType.Conjunction,
                    nodes: [
                        {
                            type: ASTType.Term,
                            field_type: xLuceneFieldType.String,
                            restricted: true,
                            quoted: false,
                            value: { type: 'value', value: 'value', },
                            field: 'field2'
                        }
                    ]
                }
            ]
        },
    ],
    [
        '((a:1) AND (b:1))',
        'double parens AND with parens conjunction',
        {
            type: ASTType.LogicalGroup,
            flow: [
                {
                    type: ASTType.Conjunction,
                    nodes: [
                        {
                            type: ASTType.Term,
                            field: 'a',
                            value: { type: 'value', value: 1, },
                        },
                        {
                            type: ASTType.Term,
                            field: 'b',
                            value: { type: 'value', value: 1, },
                        },
                    ],
                },
            ],
        },
    ],
    [
        'a:1 AND location:geoDistance(point:"33.435518,-111.873616" distance:5000m)',
        'a simple AND with geoDistance function',
        {
            type: 'logical-group',
            flow: [
                {
                    type: 'conjunction',
                    nodes: [
                        {
                            type: 'term',
                            field_type: 'integer',
                            value: { type: 'value', value: 1, },
                            field: 'a'
                        },
                        {
                            type: 'function',
                            field: 'location',
                            name: 'geoDistance'
                        }
                    ]
                }
            ]
        },
    ],
] as TestCase[];
