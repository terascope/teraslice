import { xLuceneFieldType } from '@terascope/types';
import { ASTType } from '../../src';
import { TestCase } from './interfaces';

export default [
    [
        'hi:the?e',
        'value with ? wildcard',
        {
            type: ASTType.Wildcard,
            field_type: xLuceneFieldType.String,
            field: 'hi',
            value: { type: 'value', value: 'the?e', },
        },
    ],
    [
        'foo: $foo',
        'variable with * wildcard',
        {
            type: ASTType.Term,
            field_type: xLuceneFieldType.String,
            field: 'foo',
            value: { type: 'variable', value: 'foo', },
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
            type: ASTType.Wildcard,
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
            type: ASTType.Wildcard,
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
            type: ASTType.Wildcard,
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
            type: ASTType.Wildcard,
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
            type: ASTType.Wildcard,
            field: null,
            value: { type: 'value', value: '*', },
        },
    ],
    [
        '(*)',
        'a parens field-less * query',
        {
            type: ASTType.Wildcard,
            field: null,
            value: { type: 'value', value: '*', },
        },
    ],
    [
        '?',
        'a field-less ? query',
        {
            type: ASTType.Wildcard,
            field: null,
            value: { type: 'value', value: '?', },
        },
    ],
] as TestCase[];
