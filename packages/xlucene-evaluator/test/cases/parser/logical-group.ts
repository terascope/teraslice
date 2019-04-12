import { ASTType } from '../../../src/parser';
import { TestCase } from './interfaces';

export default [
    ['a:1 AND b:1', 'a simple AND conjunction', {
        type: ASTType.LogicalGroup,
        flow: [
            {
                type: ASTType.Conjunction,
                nodes: [
                    {
                        type: ASTType.Term,
                        field: 'a',
                        value: 1,
                    },
                    {
                        type: ASTType.Term,
                        field: 'b',
                        value: 1,
                    }
                ]
            }
        ]
    }],
    ['a:1 && b:1', 'a simple && conjunction', {
        type: ASTType.LogicalGroup,
        flow: [
            {
                type: ASTType.Conjunction,
                nodes: [
                    {
                        type: ASTType.Term,
                        field: 'a',
                        value: 1,
                    },
                    {
                        type: ASTType.Term,
                        field: 'b',
                        value: 1,
                    }
                ]
            }
        ]
    }],
    ['a:1 OR b:1', 'a simple OR conjunction', {
        type: ASTType.LogicalGroup,
        flow: [
            {
                type: ASTType.Conjunction,
                nodes: [
                    {
                        type: ASTType.Term,
                        field: 'a',
                        value: 1,
                    },
                ]
            },
            {
                type: ASTType.Conjunction,
                nodes: [
                    {
                        type: ASTType.Term,
                        field: 'b',
                        value: 1,
                    }
                ]
            }
        ],
    }],
    ['foo:"bar" fo?', 'a implicit OR with wildcard', {
        type: ASTType.LogicalGroup,
        flow: [
            {
                type: ASTType.Conjunction,
                nodes: [
                    {
                        type: ASTType.Term,
                        field: 'foo',
                        value: 'bar',
                    },
                ]
            },
            {
                type: ASTType.Conjunction,
                nodes: [
                    {
                        type: ASTType.Wildcard,
                        field: null,
                        value: 'fo?',
                    }
                ]
            }
        ],
    }],
    ['a:1 || b:1', 'a simple || conjunction', {
        type: ASTType.LogicalGroup,
        flow: [
            {
                type: ASTType.Conjunction,
                nodes: [
                    {
                        type: ASTType.Term,
                        field: 'a',
                        value: 1,
                    },
                ]
            },
            {
                type: ASTType.Conjunction,
                nodes: [
                    {
                        type: ASTType.Term,
                        field: 'b',
                        value: 1,
                    }
                ]
            }
        ],
    }],
    ['a:1 OR b:1 OR c:1', 'a chained OR conjunction', {
        type: ASTType.LogicalGroup,
        flow: [
            {
                type: ASTType.Conjunction,
                nodes: [
                    {
                        type: ASTType.Term,
                        field: 'a',
                        value: 1,
                    },
                ]
            },
            {
                type: ASTType.Conjunction,
                nodes: [
                    {
                        type: ASTType.Term,
                        field: 'b',
                        value: 1,
                    },
                ]
            },
            {
                type: ASTType.Conjunction,
                nodes: [
                    {
                        type: ASTType.Term,
                        field: 'c',
                        value: 1,
                    }
                ]
            }
        ],
    }],
    ['a:1 AND b:1 AND c:1', 'a double chained AND conjunction', {
        type: ASTType.LogicalGroup,
        flow: [
            {
                type: ASTType.Conjunction,
                nodes: [
                    {
                        type: ASTType.Term,
                        field: 'a',
                        value: 1,
                    },
                    {
                        type: ASTType.Term,
                        field: 'b',
                        value: 1,
                    },
                    {
                        type: ASTType.Term,
                        field: 'c',
                        value: 1,
                    }
                ]
            }
        ]
    }],
    ['AqMvPMCS76u0 OR foo', 'OR with unqouted strings', {
        type: 'logical-group',
        flow: [
            {
                type: ASTType.Conjunction,
                nodes: [
                    {
                        type: ASTType.Term,
                        data_type: 'string',
                        value: 'AqMvPMCS76u0',
                    }
                ]
            },
            {
                type: ASTType.Conjunction,
                nodes: [
                    {
                        type: ASTType.Term,
                        data_type: 'string',
                        value: 'foo',
                    }
                ]
            },
        ]
    }],
    ['a:1 OR b:1 OR c:1 AND d:1 AND e:1', 'a chained AND/OR conjunctions', {
        type: ASTType.LogicalGroup,
        flow: [
            {
                type: ASTType.Conjunction,
                nodes: [
                    {
                        type: ASTType.Term,
                        field: 'a',
                        value: 1,
                    },
                ]
            },
            {
                type: ASTType.Conjunction,
                nodes: [
                    {
                        type: ASTType.Term,
                        field: 'b',
                        value: 1,
                    },
                ]
            },
            {
                type: ASTType.Conjunction,
                nodes: [
                    {
                        type: ASTType.Term,
                        field: 'c',
                        value: 1,
                    },
                    {
                        type: ASTType.Term,
                        field: 'd',
                        value: 1,
                    },
                    {
                        type: ASTType.Term,
                        field: 'e',
                        value: 1,
                    },
                ]
            }
        ]
    }],
    ['foo "bar"', 'implicit OR conjunction', {
        type: ASTType.LogicalGroup,
        flow: [
            {
                type: ASTType.Conjunction,
                nodes: [
                    {
                        type: ASTType.Term,
                        data_type: 'string',
                        restricted: true,
                        field: null,
                        value: 'foo'
                    },
                ]
            },
            {
                type: ASTType.Conjunction,
                nodes: [
                    {
                        type: ASTType.Term,
                        data_type: 'string',
                        field: null,
                        quoted: true,
                        value: 'bar'
                    }
                ]
            }
        ]
    }],
    ['"foo" bar:baz', 'implicit OR conjunction', {
        type: ASTType.LogicalGroup,
        flow: [
            {
                type: ASTType.Conjunction,
                nodes: [
                    {
                        type: ASTType.Term,
                        data_type: 'string',
                        field: null,
                        quoted: true,
                        value: 'foo'
                    },
                ]
            },
            {
                type: ASTType.Conjunction,
                nodes: [
                    {
                        type: ASTType.Term,
                        data_type: 'string',
                        field: 'bar',
                        value: 'baz'
                    }
                ]
            }
        ]
    }],
    ['hi:"foo" hello:"bar"', 'implicit OR conjunction', {
        type: ASTType.LogicalGroup,
        flow: [
            {
                type: ASTType.Conjunction,
                nodes: [
                    {
                        type: ASTType.Term,
                        data_type: 'string',
                        field: 'hi',
                        quoted: true,
                        value: 'foo'
                    },
                ]
            },
            {
                type: ASTType.Conjunction,
                nodes: [
                    {
                        type: ASTType.Term,
                        data_type: 'string',
                        field: 'hello',
                        quoted: true,
                        value: 'bar'
                    }
                ]
            }
        ]
    }],
    [' foo:   bar baz', 'field and space between multiple values into a conjunction', {
        type: ASTType.LogicalGroup,
        flow: [
            {
                type: ASTType.Conjunction,
                nodes: [
                    {
                        type: ASTType.Term,
                        data_type: 'string',
                        field: 'foo',
                        quoted: false,
                        value: 'bar'
                    },
                ]
            },
            {
                type: ASTType.Conjunction,
                nodes: [
                    {
                        type: ASTType.Term,
                        data_type: 'string',
                        field: null,
                        quoted: false,
                        value: 'baz'
                    }
                ],
            }
        ]
    }],
    ['a:1 AND (b:1 OR c:1) AND d:1', 'AND/OR conjunction with parens', {
        type: ASTType.LogicalGroup,
        flow: [
            {
                type: ASTType.Conjunction,
                nodes: [
                    {
                        type: ASTType.Term,
                        field: 'a',
                        value: 1,
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
                                        value: 1,
                                    },
                                ]
                            },
                            {
                                type: ASTType.Conjunction,
                                nodes: [
                                    {
                                        type: ASTType.Term,
                                        field: 'c',
                                        value: 1,
                                    },
                                ]
                            }
                        ]
                    },
                    {
                        type: ASTType.Term,
                        field: 'd',
                        value: 1,
                    }
                ]
            }
        ]
    }],
    ['(a:1 OR b:1) AND (c:1 OR d:1)', 'AND/OR conjunction with two parens', {
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
                                        data_type: 'integer',
                                        field: 'a',
                                        value: 1
                                    },
                                ]
                            },
                            {
                                type: ASTType.Conjunction,
                                nodes: [
                                    {
                                        data_type: 'integer',
                                        field: 'b',
                                        value: 1
                                    }
                                ],
                            }
                        ],
                    },
                    {
                        type: ASTType.LogicalGroup,
                        flow: [
                            {
                                type: ASTType.Conjunction,
                                nodes: [
                                    {
                                        data_type: 'integer',
                                        field: 'c',
                                        value: 1
                                    },
                                ]
                            },
                            {
                                type: ASTType.Conjunction,
                                nodes: [
                                    {
                                        data_type: 'integer',
                                        field: 'd',
                                        value: 1
                                    }
                                ],
                            }
                        ],
                    },
                ]
            },
        ]
    }]
] as TestCase[];
