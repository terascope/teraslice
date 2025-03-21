import { xLuceneFieldType } from '@terascope/types';
import {
    FunctionNode, GroupLikeNode, LogicalGroup,
    NodeType, Term, Wildcard
} from '../../src/index.js';
import { TestCase } from './interfaces.js';

export default [
    [
        'a:1 AND b:1',
        'a simple AND conjunction',
        {
            type: NodeType.LogicalGroup,
            flow: [
                {
                    type: NodeType.Conjunction,
                    nodes: [
                        {
                            type: NodeType.Term,
                            field: 'a',
                            value: { type: 'value', value: 1 },
                        },
                        {
                            type: NodeType.Term,
                            field: 'b',
                            value: { type: 'value', value: 1 },
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
            type: NodeType.LogicalGroup,
            flow: [
                {
                    type: NodeType.Conjunction,
                    nodes: [
                        {
                            type: NodeType.Term,
                            field: 'a',
                            value: { type: 'variable', value: 'foo' },
                        },
                        {
                            type: NodeType.Term,
                            field: 'b',
                            value: { type: 'variable', value: 'bar' },
                        },
                    ],
                },
            ],
        },
        { a: xLuceneFieldType.Integer, b: xLuceneFieldType.Integer },
    ],
    [
        '(a:1 AND b:1)',
        'a simple AND conjunction',
        {
            type: NodeType.LogicalGroup,
            flow: [
                {
                    type: NodeType.Conjunction,
                    nodes: [
                        {
                            type: NodeType.Term,
                            field: 'a',
                            value: { type: 'value', value: 1 },
                        },
                        {
                            type: NodeType.Term,
                            field: 'b',
                            value: { type: 'value', value: 1 },
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
            type: NodeType.LogicalGroup,
            flow: [
                {
                    type: NodeType.Conjunction,
                    nodes: [
                        {
                            type: NodeType.Term,
                            field: 'a',
                            value: { type: 'value', value: 1 },
                        },
                        {
                            type: NodeType.Term,
                            field: 'b',
                            value: { type: 'value', value: 1 },
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
            type: NodeType.LogicalGroup,
            flow: [
                {
                    type: NodeType.Conjunction,
                    nodes: [
                        {
                            type: NodeType.Term,
                            field: 'a',
                            value: { type: 'value', value: 1 },
                        },
                    ],
                },
                {
                    type: NodeType.Conjunction,
                    nodes: [
                        {
                            type: NodeType.Term,
                            field: 'b',
                            value: { type: 'value', value: 1 },
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
            type: NodeType.Term,
            field: 'foo',
            value: { type: 'variable', value: 'bar' },
        },
        {
            foo: xLuceneFieldType.Integer
        },
    ],
    [
        'foo:$bar',
        'variable array substitution',
        {
            type: NodeType.FieldGroup,
            field: 'foo',
            field_type: xLuceneFieldType.Integer,
            flow: [
                {
                    type: NodeType.Conjunction,
                    nodes: [
                        {
                            type: NodeType.Term,
                            field_type: xLuceneFieldType.Integer,
                            value: { type: 'value', value: 1 },
                        }
                    ]
                },
                {
                    type: NodeType.Conjunction,
                    nodes: [
                        {
                            type: NodeType.Term,
                            field_type: xLuceneFieldType.Integer,
                            value: { type: 'value', value: 2 },
                        }
                    ]
                },
                {
                    type: NodeType.Conjunction,
                    nodes: [
                        {
                            type: NodeType.Term,
                            field_type: xLuceneFieldType.Integer,
                            value: { type: 'value', value: 3 },
                        }
                    ]
                }
            ]
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
            type: NodeType.LogicalGroup,
            flow: [
                {
                    type: NodeType.Conjunction,
                    nodes: [
                        {
                            type: NodeType.Term,
                            field: 'a',
                            value: { type: 'value', value: 1 },
                        },
                    ],
                },
                {
                    type: NodeType.Conjunction,
                    nodes: [
                        {
                            type: NodeType.Term,
                            field: 'b',
                            value: { type: 'value', value: 1 },
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
            type: NodeType.LogicalGroup,
            flow: [
                {
                    type: NodeType.Conjunction,
                    nodes: [
                        {
                            type: NodeType.Term,
                            field: 'foo',
                            value: { type: 'value', value: 'bar' },
                        },
                    ],
                },
                {
                    type: NodeType.Conjunction,
                    nodes: [
                        {
                            type: NodeType.Wildcard,
                            field: null,
                            value: { type: 'value', value: 'fo?' },
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
            type: NodeType.LogicalGroup,
            flow: [
                {
                    type: NodeType.Conjunction,
                    nodes: [
                        {
                            type: NodeType.Term,
                            field: 'a',
                            value: { type: 'value', value: 1 },
                        },
                    ],
                },
                {
                    type: NodeType.Conjunction,
                    nodes: [
                        {
                            type: NodeType.Term,
                            field: 'b',
                            value: { type: 'value', value: 1 },
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
            type: NodeType.LogicalGroup,
            flow: [
                {
                    type: NodeType.Conjunction,
                    nodes: [
                        {
                            type: NodeType.Term,
                            field: 'a',
                            value: { type: 'value', value: 1 },
                        },
                    ],
                },
                {
                    type: NodeType.Conjunction,
                    nodes: [
                        {
                            type: NodeType.Term,
                            field: 'b',
                            value: { type: 'value', value: 1 },
                        },
                    ],
                },
                {
                    type: NodeType.Conjunction,
                    nodes: [
                        {
                            type: NodeType.Term,
                            field: 'c',
                            value: { type: 'value', value: 1 },
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
            type: NodeType.LogicalGroup,
            flow: [
                {
                    type: NodeType.Conjunction,
                    nodes: [
                        {
                            type: NodeType.Term,
                            field: 'a',
                            value: { type: 'value', value: 1 },
                        },
                        {
                            type: NodeType.Term,
                            field: 'b',
                            value: { type: 'value', value: 1 },
                        },
                        {
                            type: NodeType.Term,
                            field: 'c',
                            value: { type: 'value', value: 1 },
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
                    type: NodeType.Conjunction,
                    nodes: [
                        {
                            type: NodeType.Term,
                            field_type: xLuceneFieldType.String,
                            value: { type: 'value', value: 'AqMvPMCS76u0' },
                        },
                    ],
                },
                {
                    type: NodeType.Conjunction,
                    nodes: [
                        {
                            type: NodeType.Term,
                            field_type: xLuceneFieldType.String,
                            value: { type: 'value', value: 'foo' },
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
            type: NodeType.LogicalGroup,
            flow: [
                {
                    type: NodeType.Conjunction,
                    nodes: [
                        {
                            type: NodeType.Term,
                            field: 'a',
                            value: { type: 'value', value: 1 },
                        },
                    ],
                },
                {
                    type: NodeType.Conjunction,
                    nodes: [
                        {
                            type: NodeType.Term,
                            field: 'b',
                            value: { type: 'value', value: 1 },
                        },
                    ],
                },
                {
                    type: NodeType.Conjunction,
                    nodes: [
                        {
                            type: NodeType.Term,
                            field: 'c',
                            value: { type: 'value', value: 1 },
                        },
                        {
                            type: NodeType.Term,
                            field: 'd',
                            value: { type: 'value', value: 1 },
                        },
                        {
                            type: NodeType.Term,
                            field: 'e',
                            value: { type: 'value', value: 1 },
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
            type: NodeType.LogicalGroup,
            flow: [
                {
                    type: NodeType.Conjunction,
                    nodes: [
                        {
                            type: NodeType.Term,
                            field_type: xLuceneFieldType.String,
                            restricted: true,
                            field: null,
                            value: { type: 'value', value: 'foo' },
                        },
                    ],
                },
                {
                    type: NodeType.Conjunction,
                    nodes: [
                        {
                            type: NodeType.Term,
                            field_type: xLuceneFieldType.String,
                            field: null,
                            quoted: true,
                            value: { type: 'value', value: 'bar' },
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
            type: NodeType.LogicalGroup,
            flow: [
                {
                    type: NodeType.Conjunction,
                    nodes: [
                        {
                            type: NodeType.Term,
                            field_type: xLuceneFieldType.String,
                            field: null,
                            quoted: true,
                            value: { type: 'value', value: 'foo' },
                        },
                    ],
                },
                {
                    type: NodeType.Conjunction,
                    nodes: [
                        {
                            type: NodeType.Term,
                            field_type: xLuceneFieldType.String,
                            field: 'bar',
                            value: { type: 'value', value: 'baz' },
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
            type: NodeType.LogicalGroup,
            flow: [
                {
                    type: NodeType.Conjunction,
                    nodes: [
                        {
                            type: NodeType.Term,
                            field_type: xLuceneFieldType.String,
                            field: 'hi',
                            quoted: true,
                            value: { type: 'value', value: 'foo' },
                        },
                    ],
                },
                {
                    type: NodeType.Conjunction,
                    nodes: [
                        {
                            type: NodeType.Term,
                            field_type: xLuceneFieldType.String,
                            field: 'hello',
                            quoted: true,
                            value: { type: 'value', value: 'bar' },
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
            type: NodeType.LogicalGroup,
            flow: [
                {
                    type: NodeType.Conjunction,
                    nodes: [
                        {
                            type: NodeType.Term,
                            field_type: xLuceneFieldType.String,
                            field: 'foo',
                            quoted: false,
                            value: { type: 'value', value: 'bar' },
                        },
                    ],
                },
                {
                    type: NodeType.Conjunction,
                    nodes: [
                        {
                            type: NodeType.Term,
                            field_type: xLuceneFieldType.String,
                            field: null,
                            quoted: false,
                            value: { type: 'value', value: 'baz' },
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
            type: NodeType.LogicalGroup,
            flow: [
                {
                    type: NodeType.Conjunction,
                    nodes: [
                        {
                            type: NodeType.Term,
                            field: 'a',
                            value: { type: 'value', value: 1 },
                        },
                        {
                            type: NodeType.LogicalGroup,
                            flow: [
                                {
                                    type: NodeType.Conjunction,
                                    nodes: [
                                        {
                                            type: NodeType.Term,
                                            field: 'b',
                                            value: { type: 'value', value: 1 },
                                        },
                                    ],
                                },
                                {
                                    type: NodeType.Conjunction,
                                    nodes: [
                                        {
                                            type: NodeType.Term,
                                            field: 'c',
                                            value: { type: 'value', value: 1 },
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            type: NodeType.Term,
                            field: 'd',
                            value: { type: 'value', value: 1 },
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
            type: NodeType.LogicalGroup,
            flow: [
                {
                    type: NodeType.Conjunction,
                    nodes: [
                        {
                            type: NodeType.LogicalGroup,
                            flow: [
                                {
                                    type: NodeType.Conjunction,
                                    nodes: [
                                        {
                                            field_type: xLuceneFieldType.Integer,
                                            field: 'a',
                                            value: { type: 'value', value: 1 },
                                        },
                                    ],
                                },
                                {
                                    type: NodeType.Conjunction,
                                    nodes: [
                                        {
                                            field_type: xLuceneFieldType.Integer,
                                            field: 'b',
                                            value: { type: 'value', value: 1 },
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            type: NodeType.LogicalGroup,
                            flow: [
                                {
                                    type: NodeType.Conjunction,
                                    nodes: [
                                        {
                                            field_type: xLuceneFieldType.Integer,
                                            field: 'c',
                                            value: { type: 'value', value: 1 },
                                        },
                                    ],
                                },
                                {
                                    type: NodeType.Conjunction,
                                    nodes: [
                                        {
                                            field_type: xLuceneFieldType.Integer,
                                            field: 'd',
                                            value: { type: 'value', value: 1 },
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
            type: NodeType.LogicalGroup,
            flow: [
                {
                    type: NodeType.Conjunction,
                    nodes: [
                        {
                            type: NodeType.Term,
                            field: 'a',
                            value: { type: 'value', value: 1 },
                        },
                        {
                            type: NodeType.Term,
                            field: 'b',
                            value: { type: 'value', value: 1 },
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
            type: NodeType.LogicalGroup,
            flow: [
                {
                    type: NodeType.Conjunction,
                    nodes: [
                        {
                            type: NodeType.Term,
                            field_type: xLuceneFieldType.String,
                            restricted: true,
                            quoted: false,
                            value: { type: 'value', value: 'value' },
                            field: 'field'
                        }
                    ]
                },
                {
                    type: NodeType.Conjunction,
                    nodes: [
                        {
                            type: NodeType.Term,
                            field_type: xLuceneFieldType.String,
                            restricted: true,
                            quoted: false,
                            value: { type: 'value', value: 'value' },
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
            type: NodeType.LogicalGroup,
            flow: [
                {
                    type: NodeType.Conjunction,
                    nodes: [
                        {
                            type: NodeType.Term,
                            field: 'a',
                            value: { type: 'value', value: 1 },
                        },
                        {
                            type: NodeType.Term,
                            field: 'b',
                            value: { type: 'value', value: 1 },
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

            type: NodeType.LogicalGroup,
            flow: [
                {
                    type: 'conjunction',
                    nodes: [
                        {
                            type: NodeType.Term,
                            field_type: 'integer',
                            value: { type: 'value', value: 1 },
                            field: 'a'
                        },
                        {
                            type: NodeType.Function,
                            field: 'location',
                            name: 'geoDistance'
                        } as FunctionNode
                    ]
                }
            ]
        } as LogicalGroup,
    ],
] as TestCase[];

export const filterNilLogical: TestCase[] = [
    [
        'a:1 AND b:$foo',
        'a simple AND conjunction (var right missing)',
        {
            type: NodeType.Term,
            field: 'a',
            value: { type: 'value', value: 1 }
        } as Term,
    ],
    [
        'a:$foo AND b:2',
        'a simple AND conjunction (var left missing)',
        {
            type: NodeType.Term,
            field: 'b',
            value: { type: 'value', value: 2 },
        } as Term,
        { a: xLuceneFieldType.Integer, b: xLuceneFieldType.Integer },
    ],
    [
        'a:$foo AND b:$bar',
        'a simple AND conjunction (both vars missing)',
        {
            type: NodeType.Empty,
        },
        { a: xLuceneFieldType.Integer, b: xLuceneFieldType.Integer },
    ],
    [
        '(a:1 AND b:$foo)',
        'a simple AND conjunction parens',
        {
            type: NodeType.Term,
            field: 'a',
            value: { type: 'value', value: 1 }
        } as Term,
    ],
    [
        'a:$foo && b:1',
        'a simple && conjunction',
        {
            type: NodeType.Term,
            field: 'b',
            value: { type: 'value', value: 1 },
        } as Term,
    ],
    [
        'a:1 OR b:$foo',
        'a simple OR conjunction',
        {
            type: NodeType.Term,
            field: 'a',
            value: { type: 'value', value: 1 },
        } as Term,
    ],
    [
        'foo:$bar',
        'variable array substitution',
        {
            type: NodeType.Term,
            field: 'foo',
            field_type: xLuceneFieldType.Integer,
            value: { type: 'variable', scoped: false, value: 'bar' },
        } as Term,
        { foo: xLuceneFieldType.Integer },
        { bar: [1, 2, 3] },
        {
            type: NodeType.FieldGroup,
            field: 'foo',
            field_type: xLuceneFieldType.Integer,
            flow: [
                {
                    type: NodeType.Conjunction,
                    nodes: [
                        {
                            type: NodeType.Term,
                            field_type: xLuceneFieldType.Integer,
                            value: { type: 'value', value: 1 },
                        } as Term
                    ]
                },
                {
                    type: NodeType.Conjunction,
                    nodes: [
                        {
                            type: NodeType.Term,
                            field_type: xLuceneFieldType.Integer,
                            value: { type: 'value', value: 2 },
                        }
                    ]
                },
                {
                    type: NodeType.Conjunction,
                    nodes: [
                        {
                            type: NodeType.Term,
                            field_type: xLuceneFieldType.Integer,
                            value: { type: 'value', value: 3 },
                        }
                    ]
                }
            ]
        } as GroupLikeNode,
    ],
    [
        'foo:$foo fo?',
        'a implicit OR with wildcard',
        {
            type: NodeType.Wildcard,
            field: null,
            value: { type: 'value', value: 'fo?' },
        } as Wildcard,
    ],
    [
        'a:$bar || b:1',
        'a simple || conjunction',
        {
            type: NodeType.Term,
            field: 'b',
            value: { type: 'value', value: 1 },
        } as Term,
    ],
    [
        'a:1 OR b:$foo OR c:1',
        'a chained OR conjunction',
        {
            type: NodeType.LogicalGroup,
            flow: [
                {
                    type: NodeType.Conjunction,
                    nodes: [
                        {
                            type: NodeType.Term,
                            field: 'a',
                            value: { type: 'value', value: 1 },
                        } as Term,
                    ],
                },
                {
                    type: NodeType.Conjunction,
                    nodes: [
                        {
                            type: NodeType.Term,
                            field: 'c',
                            value: { type: 'value', value: 1 },
                        },
                    ],
                },
            ],
        } as LogicalGroup,
    ],
    [
        'a:1 AND b:1 AND c:$bar',
        'a double chained AND conjunction',
        {
            type: NodeType.LogicalGroup,
            flow: [
                {
                    type: NodeType.Conjunction,
                    nodes: [
                        {
                            type: NodeType.Term,
                            field: 'a',
                            value: { type: 'value', value: 1 },
                        } as Term,
                        {
                            type: NodeType.Term,
                            field: 'b',
                            value: { type: 'value', value: 1 },
                        } as Term,
                    ],
                },
            ],
        } as LogicalGroup,
    ],
    [
        'a:$foo AND b:1 AND c:$bar',
        'a double chained AND conjunction',
        {
            type: NodeType.Term,
            field: 'b',
            value: { type: 'value', value: 1 },
        } as Term,
    ],
    [
        'AqMvPMCS76u0 OR $foo',
        'OR with unquoted strings',
        {
            type: NodeType.Term,
            field_type: xLuceneFieldType.String,
            value: { type: 'value', value: 'AqMvPMCS76u0' },
        } as Term,
    ],
    [
        'a:1 OR b:$foo OR c:1 AND d:$bar AND e:1',
        'a chained AND/OR conjunctions',
        {
            type: NodeType.LogicalGroup,
            flow: [
                {
                    type: NodeType.Conjunction,
                    nodes: [
                        {
                            type: NodeType.Term,
                            field: 'a',
                            value: { type: 'value', value: 1 },
                        } as Term,
                    ],
                },
                {
                    type: NodeType.Conjunction,
                    nodes: [
                        {
                            type: NodeType.Term,
                            field: 'c',
                            value: { type: 'value', value: 1 },
                        } as Term,
                        {
                            type: NodeType.Term,
                            field: 'e',
                            value: { type: 'value', value: 1 },
                        } as Term,
                    ],
                },
            ],
        } as LogicalGroup,
    ],
    [
        '$foo "bar"',
        'implicit OR conjunction',
        {
            type: NodeType.Term,
            field_type: xLuceneFieldType.String,
            field: null,
            quoted: true,
            value: { type: 'value', value: 'bar' }
        } as Term,
    ],
    [
        '"foo" bar:$baz',
        'implicit OR conjunction',
        {
            type: NodeType.Term,
            field_type: xLuceneFieldType.String,
            field: null,
            quoted: true,
            value: { type: 'value', value: 'foo' },
        } as Term,
    ],
    [
        'a:1 AND (b:$bar OR c:1) AND d:1',
        'AND/OR conjunction with parens',
        {
            type: NodeType.LogicalGroup,
            flow: [
                {
                    type: NodeType.Conjunction,
                    nodes: [
                        {
                            type: NodeType.Term,
                            field: 'a',
                            value: { type: 'value', value: 1 },
                        } as Term,
                        {
                            type: NodeType.Term,
                            field: 'c',
                            value: { type: 'value', value: 1 },
                        },
                        {
                            type: NodeType.Term,
                            field: 'd',
                            value: { type: 'value', value: 1 },
                        },
                    ],
                },
            ],
        } as LogicalGroup,
    ],
    [
        '(a:1 OR b:1) AND (c:$foo OR d:1)',
        'AND/OR conjunction with two parens',
        {
            type: NodeType.LogicalGroup,
            flow: [
                {
                    type: NodeType.Conjunction,
                    nodes: [
                        {
                            type: NodeType.LogicalGroup,
                            flow: [
                                {
                                    type: NodeType.Conjunction,
                                    nodes: [
                                        {
                                            field_type: xLuceneFieldType.Integer,
                                            field: 'a',
                                            value: { type: 'value', value: 1 },
                                        },
                                    ],
                                },
                                {
                                    type: NodeType.Conjunction,
                                    nodes: [
                                        {
                                            field_type: xLuceneFieldType.Integer,
                                            field: 'b',
                                            value: { type: 'value', value: 1 },
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            type: NodeType.Term,
                            field_type: xLuceneFieldType.Integer,
                            field: 'd',
                            value: { type: 'value', value: 1 },

                        } as Term,
                    ],
                },
            ],
        } as LogicalGroup,
    ],
    [
        '(a:1) AND (b:$foo)',
        'a simple AND with parens conjunction',
        {
            type: NodeType.Term,
            field: 'a',
            value: { type: 'value', value: 1 },
        } as Term,
    ],
    [
        '((field: value OR field2:$foo))',
        'double parens expression',
        {
            type: NodeType.Term,
            field_type: xLuceneFieldType.String,
            restricted: true,
            quoted: false,
            value: { type: 'value', value: 'value' },
            field: 'field'
        } as Term,
    ],
    [
        '((a:1) AND (b:$foo))',
        'double parens AND with parens conjunction',
        {
            type: NodeType.Term,
            field: 'a',
            value: { type: 'value', value: 1 }
        } as Term,
    ],
    [
        'a:$foo AND location:geoDistance(point:"33.435518,-111.873616" distance:5000m)',
        'a simple AND with geoDistance function',
        {
            type: NodeType.Function,
            field: 'location',
            name: 'geoDistance'
        } as FunctionNode,
    ],
];
