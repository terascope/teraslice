import { FieldType, ASTType } from '../../../src';
import { TestCase } from './interfaces';

export default [
    [
        'bar',
        'an unquoted string',
        {
            type: ASTType.Term,
            field_type: FieldType.String,
            quoted: false,
            field: null,
            value: 'bar',
        },
    ],
    [
        'foo bar',
        'an unquoted string',
        {
            type: ASTType.Term,
            field_type: FieldType.String,
            quoted: false,
            field: null,
            value: 'foo bar',
        },
    ],
    [
        '"foo"',
        'a quoted string',
        {
            type: ASTType.Term,
            field_type: FieldType.String,
            field: null,
            quoted: true,
            value: 'foo',
        },
    ],
    [
        '\\"foo\\"',
        'an escaped quoted string',
        {
            type: ASTType.Term,
            field_type: FieldType.String,
            field: null,
            quoted: false,
            value: '\\"foo\\"',
        },
    ],
    [
        'foo:\\"bar\\"',
        'field with escaped quoted string',
        {
            type: ASTType.Term,
            field_type: FieldType.String,
            field: 'foo',
            quoted: false,
            value: '\\"bar\\"',
        },
    ],
    [
        'foo:\\"bar',
        'field with one escaped quoted string',
        {
            type: ASTType.Term,
            field_type: FieldType.String,
            field: 'foo',
            quoted: false,
            value: '\\"bar',
        },
    ],
    [
        'foo:"\\""',
        'field with using a quoted escaped quote',
        {
            type: ASTType.Term,
            field_type: FieldType.String,
            field: 'foo',
            quoted: true,
            value: '\\"',
        },
    ],
    [
        'foo:bar',
        'field with string value',
        {
            type: ASTType.Term,
            field_type: FieldType.String,
            field: 'foo',
            quoted: false,
            value: 'bar',
        },
    ],
    [
        'foo:   bar',
        'field with space between string value',
        {
            type: ASTType.Term,
            field_type: FieldType.String,
            field: 'foo',
            quoted: false,
            value: 'bar',
        },
    ],
    [
        'foo:"bar"',
        'field with quoted string value',
        {
            type: ASTType.Term,
            field_type: FieldType.String,
            field: 'foo',
            quoted: true,
            value: 'bar',
        },
    ],
    [
        'count:123',
        'field with quoted integer value',
        {
            type: ASTType.Term,
            field_type: FieldType.Integer,
            field: 'count',
            value: 123,
        },
    ],
    [
        'count:"123"',
        'field with quoted integer value',
        {
            type: ASTType.Term,
            field_type: FieldType.String,
            field: 'count',
            quoted: true,
            value: '123',
        },
    ],
    [
        'count_str:123',
        'field with unqouted string type that is numeric',
        {
            type: ASTType.Term,
            field_type: FieldType.String,
            field: 'count_str',
            quoted: false,
            value: '123',
        },
        {
            count_str: 'string'
        }
    ],
    [
        'cash:50.50',
        'field with float value',
        {
            type: ASTType.Term,
            field_type: FieldType.Float,
            field: 'cash',
            value: 50.5,
        },
    ],
    [
        'cash:"50.50"',
        'field with float value',
        {
            type: ASTType.Term,
            field_type: FieldType.String,
            field: 'cash',
            quoted: true,
            value: '50.50',
        },
    ],
    [
        'bool:false',
        'field with bool false',
        {
            type: ASTType.Term,
            field_type: FieldType.Boolean,
            field: 'bool',
            value: false,
        },
    ],
    [
        'bool:true',
        'field with bool true',
        {
            type: ASTType.Term,
            field_type: FieldType.Boolean,
            field: 'bool',
            value: true,
        },
    ],
    [
        'fo?:bar',
        'field name with wildcard',
        {
            type: ASTType.Term,
            field_type: FieldType.String,
            field: 'fo?',
            value: 'bar',
        },
    ],
    [
        'foo:"ba?"',
        'field with q quoted wildcard',
        {
            type: ASTType.Term,
            field_type: FieldType.String,
            field: 'foo',
            quoted: true,
            value: 'ba?',
        },
    ],
    [
        'val:(155 223)',
        'a field with parens unqouted string',
        {
            type: ASTType.Term,
            field_type: FieldType.String,
            field: 'val',
            quoted: false,
            value: '155 223',
        },
    ],
    [
        '(155 223)',
        'a parens unqouted string',
        {
            type: ASTType.Term,
            field_type: FieldType.String,
            field: null,
            quoted: false,
            value: '155 223',
        },
    ],
    [
        '(foo:bar)',
        'a field value with parens',
        {
            type: ASTType.Term,
            field_type: FieldType.String,
            field: 'foo',
            quoted: false,
            value: 'bar',
        },
    ],
] as TestCase[];
