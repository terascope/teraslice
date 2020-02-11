import { FieldType, ASTType } from '../../../src';
import { TestCase } from './interfaces';

export default [
    [
        'hi:the?e',
        'value with ? wildcard',
        {
            type: ASTType.Wildcard,
            field_type: FieldType.String,
            field: 'hi',
            value: 'the?e',
        },
    ],
    [
        'hi:?here',
        'value with a prefix wildcard',
        {
            type: ASTType.Wildcard,
            field_type: FieldType.String,
            field: 'hi',
            value: '?here',
        },
        {
            hi: FieldType.String
        }
    ],
    [
        'hi:ther*',
        'value with a * wildcard',
        {
            type: ASTType.Wildcard,
            field_type: FieldType.String,
            field: 'hi',
            value: 'ther*',
        },
        {
            hi: FieldType.String
        }
    ],
    [
        'hi:the?*',
        'value with a * and ? wildcard',
        {
            type: ASTType.Wildcard,
            field_type: FieldType.String,
            field: 'hi',
            value: 'the?*',
        },
        {
            hi: FieldType.String
        }
    ],
    [
        'hi:th?r*',
        'value with a * and ? wildcard',
        {
            type: ASTType.Wildcard,
            field_type: FieldType.String,
            field: 'hi',
            value: 'th?r*',
        },
        {
            hi: FieldType.String
        }
    ],
    [
        '*',
        'a field-less * query',
        {
            type: ASTType.Wildcard,
            field: null,
            value: '*',
        },
    ],
    [
        '(*)',
        'a parens field-less * query',
        {
            type: ASTType.Wildcard,
            field: null,
            value: '*',
        },
    ],
    [
        '?',
        'a field-less ? query',
        {
            type: ASTType.Wildcard,
            field: null,
            value: '?',
        },
    ],
] as TestCase[];
