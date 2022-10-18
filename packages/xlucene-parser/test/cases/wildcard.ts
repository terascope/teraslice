import { xLuceneFieldType } from '@terascope/types';
import { NodeType, Wildcard } from '../../src/index.js';
import { TestCase } from './interfaces.js';

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
