import { xLuceneFieldType } from '@terascope/types';
import { ASTType } from '../../src';
import { TestCase } from './interfaces';

export default [
    [
        'NOT name:Madman',
        'negate a single field/value',
        {
            type: ASTType.Negation,
            node: {
                type: ASTType.Term,
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
            type: ASTType.Negation,
            node: {
                type: ASTType.Term,
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
            type: ASTType.Negation,
            node: {
                type: ASTType.Term,
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
            type: ASTType.Negation,
            node: {
                type: ASTType.Term,
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
            type: ASTType.Negation,
            node: {
                type: ASTType.Term,
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
            type: ASTType.Negation,
            node: {
                type: ASTType.Term,
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
            type: ASTType.Negation,
            node: {
                type: ASTType.Term,
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
                        {
                            type: ASTType.Negation,
                            node: {
                                type: ASTType.Term,
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
                            type: ASTType.Negation,
                            node: {
                                type: ASTType.Term,
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
                        {
                            type: ASTType.Negation,
                            node: {
                                type: ASTType.Term,
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
                            type: ASTType.Negation,
                            node: {
                                type: ASTType.Term,
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
                            type: ASTType.Negation,
                            node: {
                                type: ASTType.Term,
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
                            type: ASTType.Negation,
                            node: {
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
                        },
                    ],
                },
            ],
        },
    ],
] as TestCase[];
