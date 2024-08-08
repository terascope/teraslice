import { xLuceneFieldType } from '@terascope/types';
import {
    LogicalGroup, Negation, NodeType, Term
} from '../../src/index.js';
import { TestCase } from './interfaces.js';

export default [
    [
        'NOT name:Madman',
        'negate a single field/value',
        {
            type: NodeType.Negation,
            node: {
                type: NodeType.Term,
                field_type: xLuceneFieldType.String,
                field: 'name',
                value: { type: 'value', value: 'Madman', },
            },
        },
    ],
    [
        '(NOT name:Madman)',
        'negate with parens and a single field/value',
        {
            type: NodeType.Negation,
            node: {
                type: NodeType.Term,
                field_type: xLuceneFieldType.String,
                field: 'name',
                value: { type: 'value', value: 'Madman', },
            },
        },
    ],
    [
        '!name:Madman',
        'negate a single field/value',
        {
            type: NodeType.Negation,
            node: {
                type: NodeType.Term,
                field_type: xLuceneFieldType.String,
                field: 'name',
                value: { type: 'value', value: 'Madman', },
            },
        },
    ],
    [
        'NOT name:$foo',
        'negate a single field/value with variables',
        {
            type: NodeType.Negation,
            node: {
                type: NodeType.Term,
                field_type: xLuceneFieldType.String,
                field: 'name',
                value: { type: 'variable', value: 'foo', },
            },
        },
        { name: xLuceneFieldType.String },
    ],
    [
        '(NOT name:$foo)',
        'negate with parens and a single field/value with variables',
        {
            type: NodeType.Negation,
            node: {
                type: NodeType.Term,
                field_type: xLuceneFieldType.String,
                field: 'name',
                value: { type: 'variable', value: 'foo', },
            },
        },
        { name: xLuceneFieldType.String },
    ],
    [
        '!name:$foo',
        'negate a single field/value with variables',
        {
            type: NodeType.Negation,
            node: {
                type: NodeType.Term,
                field_type: xLuceneFieldType.String,
                field: 'name',
                value: { type: 'variable', value: 'foo', },
            },
        },
        { name: xLuceneFieldType.String },
    ],
    [
        '!(name:$foo)',
        'parens negate a single field/value with variables',
        {
            type: NodeType.Negation,
            node: {
                type: NodeType.Term,
                field_type: xLuceneFieldType.String,
                field: 'name',
                value: { type: 'variable', value: 'foo', },
            },
        },
        { name: xLuceneFieldType.String },
    ],
    [
        'foo:bar NOT name:Madman',
        'simple NOT conjunction',
        {
            type: NodeType.LogicalGroup,
            flow: [
                {
                    type: NodeType.Conjunction,
                    nodes: [
                        {
                            type: NodeType.Term,
                            field: 'foo',
                            value: { type: 'value', value: 'bar', },
                        },
                        {
                            type: NodeType.Negation,
                            node: {
                                type: NodeType.Term,
                                field_type: xLuceneFieldType.String,
                                field: 'name',
                                value: { type: 'value', value: 'Madman', },
                            },
                        },
                    ],
                },
            ],
        },
    ],
    [
        'foo:bar ! name:Madman',
        'an implicit OR with ! negation',
        {
            type: NodeType.LogicalGroup,
            flow: [
                {
                    type: NodeType.Conjunction,
                    nodes: [
                        {
                            type: NodeType.Term,
                            field: 'foo',
                            value: { type: 'value', value: 'bar', },
                        },
                    ],
                },
                {
                    type: NodeType.Conjunction,
                    nodes: [
                        {
                            type: NodeType.Negation,
                            node: {
                                type: NodeType.Term,
                                field_type: xLuceneFieldType.String,
                                field: 'name',
                                value: { type: 'value', value: 'Madman', },
                            },
                        },
                    ],
                },
            ],
        },
    ],
    [
        'foo:bar AND NOT name:Madman',
        'simple AND NOT conjunction',
        {
            type: NodeType.LogicalGroup,
            flow: [
                {
                    type: NodeType.Conjunction,
                    nodes: [
                        {
                            type: NodeType.Term,
                            field: 'foo',
                            value: { type: 'value', value: 'bar', },
                        },
                        {
                            type: NodeType.Negation,
                            node: {
                                type: NodeType.Term,
                                field_type: xLuceneFieldType.String,
                                field: 'name',
                                value: { type: 'value', value: 'Madman', },
                            },
                        },
                    ],
                },
            ],
        },
    ],
    [
        'foo:bar OR NOT name:Madman',
        'simple OR NOT conjunction',
        {
            type: NodeType.LogicalGroup,
            flow: [
                {
                    type: NodeType.Conjunction,
                    nodes: [
                        {
                            type: NodeType.Term,
                            field: 'foo',
                            value: { type: 'value', value: 'bar', },
                        },
                    ],
                },
                {
                    type: NodeType.Conjunction,
                    nodes: [
                        {
                            type: NodeType.Negation,
                            node: {
                                type: NodeType.Term,
                                field_type: xLuceneFieldType.String,
                                field: 'name',
                                value: { type: 'value', value: 'Madman', },
                            },
                        },
                    ],
                },
            ],
        },
    ],
    [
        'foo:bar OR !name:Madman',
        'simple OR ! conjunction',
        {
            type: NodeType.LogicalGroup,
            flow: [
                {
                    type: NodeType.Conjunction,
                    nodes: [
                        {
                            type: NodeType.Term,
                            field: 'foo',
                            value: { type: 'value', value: 'bar', },
                        },
                    ],
                },
                {
                    type: NodeType.Conjunction,
                    nodes: [
                        {
                            type: NodeType.Negation,
                            node: {
                                type: NodeType.Term,
                                field_type: xLuceneFieldType.String,
                                field: 'name',
                                value: { type: 'value', value: 'Madman', },
                            },
                        },
                    ],
                },
            ],
        },
    ],
    [
        'a:1 AND !(b:1 OR c:1)',
        'a parens negation conjunction',
        {
            type: NodeType.LogicalGroup,
            flow: [
                {
                    type: NodeType.Conjunction,
                    nodes: [
                        {
                            type: NodeType.Term,
                            field: 'a',
                            value: { type: 'value', value: 1, },
                        },
                        {
                            type: NodeType.Negation,
                            node: {
                                type: NodeType.LogicalGroup,
                                flow: [
                                    {
                                        type: NodeType.Conjunction,
                                        nodes: [
                                            {
                                                type: NodeType.Term,
                                                field: 'b',
                                                value: { type: 'value', value: 1, },
                                            } as Term,
                                        ],
                                    },
                                    {
                                        type: NodeType.Conjunction,
                                        nodes: [
                                            {
                                                type: NodeType.Term,
                                                field: 'c',
                                                value: { type: 'value', value: 1, },
                                            } as Term,
                                        ],
                                    },
                                ],
                            } as LogicalGroup,
                        } as Negation,
                    ],
                },
            ],
        } as LogicalGroup,
    ],
] as TestCase[];

export const filterNilNegation: TestCase[] = [
    [
        'NOT name:$foo',
        'negate a single field/value',
        {
            type: NodeType.Empty,

        },
        { name: xLuceneFieldType.String },
    ],
    [
        '(NOT name:$bar)',
        'negate with parens and a single field/value',
        {
            type: NodeType.Empty,
        }
    ],
    [
        '!name:$foo',
        'negate a single field/value',
        {
            type: NodeType.Empty,
        }
    ],
    [
        '!(name:$foo)',
        'parens negate a single field/value',
        {
            type: NodeType.Empty,
        },
        { name: xLuceneFieldType.String }
    ],
    [
        'foo:bar NOT name:$foo',
        'simple NOT conjunction',
        {
            type: NodeType.Term,
            field: 'foo',
            value: { type: 'value', value: 'bar', },
        } as Term
    ],
    [
        'foo:bar ! name:$foo',
        'an implicit OR with ! negation',
        {
            type: NodeType.Term,
            field: 'foo',
            value: { type: 'value', value: 'bar', },
        } as Term
    ],
    [
        'foo:bar AND NOT name:$foo',
        'simple AND NOT conjunction',
        {
            type: NodeType.Term,
            field: 'foo',
            value: { type: 'value', value: 'bar', },
        } as Term
    ],
    [
        'foo:bar OR NOT name:$foo',
        'simple OR NOT conjunction',
        {
            type: NodeType.Term,
            field: 'foo',
            value: { type: 'value', value: 'bar', },
        } as Term
    ],
    [
        'foo:bar OR !name:$bar',
        'simple OR ! conjunction',
        {
            type: NodeType.Term,
            field: 'foo',
            value: { type: 'value', value: 'bar', },
        } as Term
    ],
    [
        'a:1 AND !(b:1 OR c:$foo)',
        'a parens negation conjunction',
        {
            type: NodeType.LogicalGroup,
            flow: [
                {
                    type: NodeType.Conjunction,
                    nodes: [
                        {
                            type: NodeType.Term,
                            field: 'a',
                            value: { type: 'value', value: 1, },
                        },
                        {
                            type: NodeType.Negation,
                            node: {
                                type: NodeType.Term,
                                field: 'b',
                                value: { type: 'value', value: 1, },
                            },
                        } as Negation,
                    ],
                },
            ],
        } as LogicalGroup,
    ],
];
