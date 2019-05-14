import { ASTType } from '../../../src/parser';
import { TestCase } from './interfaces';

export default [
    [
        'bar',
        'an unquoted string',
        {
            type: ASTType.Term,
            data_type: 'string',
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
            data_type: 'string',
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
            data_type: 'string',
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
            data_type: 'string',
            field: null,
            quoted: false,
            value: '\\"foo\\"',
        },
    ],
    [
        'foo:\\"bar\\"',
        'field and escaped quoted string',
        {
            type: ASTType.Term,
            data_type: 'string',
            field: 'foo',
            quoted: false,
            value: '\\"bar\\"',
        },
    ],
    [
        'foo:\\"bar',
        'field and one escaped quoted string',
        {
            type: ASTType.Term,
            data_type: 'string',
            field: 'foo',
            quoted: false,
            value: '\\"bar',
        },
    ],
    [
        'foo:"\\""',
        'field and using a quoted escaped quote',
        {
            type: ASTType.Term,
            data_type: 'string',
            field: 'foo',
            quoted: true,
            value: '\\"',
        },
    ],
    [
        'foo:bar',
        'field and string value',
        {
            type: ASTType.Term,
            data_type: 'string',
            field: 'foo',
            quoted: false,
            value: 'bar',
        },
    ],
    [
        'foo:   bar',
        'field and space between string value',
        {
            type: ASTType.Term,
            data_type: 'string',
            field: 'foo',
            quoted: false,
            value: 'bar',
        },
    ],
    [
        'foo:"bar"',
        'field and quoted string value',
        {
            type: ASTType.Term,
            data_type: 'string',
            field: 'foo',
            quoted: true,
            value: 'bar',
        },
    ],
    [
        'count:123',
        'field and integer value',
        {
            type: ASTType.Term,
            data_type: 'integer',
            field: 'count',
            value: 123,
        },
    ],
    [
        'count:"123"',
        'field and integer value',
        {
            type: ASTType.Term,
            data_type: 'string',
            field: 'count',
            quoted: true,
            value: '123',
        },
    ],
    [
        'cash:50.50',
        'field and float value',
        {
            type: ASTType.Term,
            data_type: 'float',
            field: 'cash',
            value: 50.5,
        },
    ],
    [
        'cash:"50.50"',
        'field and float value',
        {
            type: ASTType.Term,
            data_type: 'string',
            field: 'cash',
            quoted: true,
            value: '50.50',
        },
    ],
    [
        'bool:false',
        'field and bool false',
        {
            type: ASTType.Term,
            data_type: 'boolean',
            field: 'bool',
            value: false,
        },
    ],
    [
        'bool:true',
        'field and bool true',
        {
            type: ASTType.Term,
            data_type: 'boolean',
            field: 'bool',
            value: true,
        },
    ],
    [
        'fo?:bar',
        'field name with wildcard',
        {
            type: ASTType.Term,
            data_type: 'string',
            field: 'fo?',
            value: 'bar',
        },
    ],
    [
        'val:(155 223)',
        'a field with parens unqouted string',
        {
            type: ASTType.Term,
            data_type: 'string',
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
            data_type: 'string',
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
            data_type: 'string',
            field: 'foo',
            quoted: false,
            value: 'bar',
        },
    ],
] as TestCase[];
