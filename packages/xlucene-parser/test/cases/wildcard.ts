import { xLuceneFieldType } from '@terascope/types';
import {
    LogicalGroup, NodeType, Term, Wildcard
} from '../../src';
import { TestCase } from './interfaces';

export default [
    [
        'hi:the?e',
        'value with ? wildcard',
        {
            type: NodeType.Wildcard,
            field_type: xLuceneFieldType.String,
            field: 'hi',
            value: { type: 'value', value: 'the?e', },
        },
    ],
    [
        'foo: $foo',
        'variable with * wildcard',
        {
            type: NodeType.Term,
            field_type: xLuceneFieldType.String,
            field: 'foo',
            value: { type: 'value', value: 'ba*' },
        },
        {
            foo: xLuceneFieldType.String
        },
        {
            foo: 'ba*'
        }
    ],
    [
        'hi:?here',
        'value with a prefix wildcard',
        {
            type: NodeType.Wildcard,
            field_type: xLuceneFieldType.String,
            field: 'hi',
            value: { type: 'value', value: '?here', },
        },
        {
            hi: xLuceneFieldType.String
        }
    ],
    [
        'hi:ther*',
        'value with a * wildcard',
        {
            type: NodeType.Wildcard,
            field_type: xLuceneFieldType.String,
            field: 'hi',
            value: { type: 'value', value: 'ther*', },
        },
        {
            hi: xLuceneFieldType.String
        }
    ],
    [
        'hi:the?*',
        'value with a * and ? wildcard',
        {
            type: NodeType.Wildcard,
            field_type: xLuceneFieldType.String,
            field: 'hi',
            value: { type: 'value', value: 'the?*', },
        },
        {
            hi: xLuceneFieldType.String
        }
    ],
    [
        'hi:th?r*',
        'value with a * and ? wildcard',
        {
            type: NodeType.Wildcard,
            field_type: xLuceneFieldType.String,
            field: 'hi',
            value: { type: 'value', value: 'th?r*', },
        },
        {
            hi: xLuceneFieldType.String
        }
    ],
    [
        '*',
        'a field-less * query',
        {
            type: NodeType.Wildcard,
            field: null,
            value: { type: 'value', value: '*', },
        } as Wildcard,
    ],
    [
        '(*)',
        'a parens field-less * query',
        {
            type: NodeType.Wildcard,
            field: null,
            value: { type: 'value', value: '*', },
        },
    ],
    [
        '?',
        'a field-less ? query',
        {
            type: NodeType.Wildcard,
            field: null,
            value: { type: 'value', value: '?', },
        },
    ],
] as TestCase[];

export const filterNilWildcard: TestCase[] = [
    [
        'foo: $foo OR $bar',
        'variable with * wildcard',
        {
            type: NodeType.Term,
            field_type: xLuceneFieldType.String,
            field: 'foo',
            value: { type: 'variable', value: 'foo' },
        } as Term,
        { foo: xLuceneFieldType.String },
        { foo: 'ba*' },
        {
            type: NodeType.Term,
            field_type: xLuceneFieldType.String,
            field: 'foo',
            value: { type: 'value', value: 'ba*' },
        } as Term,
    ],
    [
        '* AND $foo',
        'a field-less * query',
        {
            type: NodeType.Wildcard,
            field_type: xLuceneFieldType.String,
            field: null,
            value: { type: 'value', value: '*', },
        } as Wildcard,
    ],
    [
        'ba* AND $foo AND b:1',
        'a simple AND conjunction',
        {
            type: NodeType.LogicalGroup,
            flow: [
                {
                    type: NodeType.Conjunction,
                    nodes: [
                        {
                            type: 'wildcard',
                            field_type: 'string',
                            value: {
                                type: 'value',
                                value: 'ba*'
                            },
                            field: null
                        } as Wildcard,
                        {
                            type: NodeType.Term,
                            field: 'b',
                            value: { type: 'value', value: 1, },
                        } as Term,
                    ],
                },
            ],
        } as LogicalGroup,
    ],
];
