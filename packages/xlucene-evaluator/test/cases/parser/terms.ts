import { TestCase } from './interfaces';

export default [
    ['bar', 'parse an unquoted string', {
        type: 'term',
        data_type: 'string',
        quoted: false,
        field: null,
        value: 'bar'
    }],
    ['foo bar', 'parse an unquoted string', {
        type: 'term',
        data_type: 'string',
        quoted: false,
        field: null,
        value: 'foo bar'
    }],
    ['"foo"', 'parse a quoted string', {
        type: 'term',
        data_type: 'string',
        field: null,
        quoted: true,
        value: 'foo'
    }],
    ['\\"foo\\"', 'parse an escaped quoted string', {
        type: 'term',
        data_type: 'string',
        field: null,
        quoted: false,
        value: '\\"foo\\"'
    }],
    ['foo:\\"bar\\"', 'parse field and escaped quoted string', {
        type: 'term',
        data_type: 'string',
        field: 'foo',
        quoted: false,
        value: '\\"bar\\"'
    }],
    ['foo:\\"bar', 'parse field and one escaped quoted string', {
        type: 'term',
        data_type: 'string',
        field: 'foo',
        quoted: false,
        value: '\\"bar'
    }],
    ['foo:"\\""', 'parse field and using a quoted escaped quote', {
        type: 'term',
        data_type: 'string',
        field: 'foo',
        quoted: true,
        value: '\\"'
    }],
    ['foo:bar', 'parse field and string value', {
        type: 'term',
        data_type: 'string',
        field: 'foo',
        quoted: false,
        value: 'bar'
    }],
    ['foo:   bar', 'parse field and space between string value', {
        type: 'term',
        data_type: 'string',
        field: 'foo',
        quoted: false,
        value: 'bar'
    }],
    ['foo:   bar baz', 'parse field and space between string value with more spaces and values', {
        type: 'term',
        data_type: 'string',
        field: 'foo',
        quoted: false,
        value: 'bar baz'
    }],
    ['foo:"bar"', 'parse field and quoted string value', {
        type: 'term',
        data_type: 'string',
        field: 'foo',
        quoted: true,
        value: 'bar'
    }],
    ['count:123', 'parse field and integer value', {
        type: 'term',
        data_type: 'integer',
        field: 'count',
        value: 123
    }],
    ['count:"123"', 'parse field and integer value', {
        type: 'term',
        data_type: 'string',
        field: 'count',
        quoted: true,
        value: '123'
    }],
    ['cash:50.50', 'parse field and float value', {
        type: 'term',
        data_type: 'float',
        field: 'cash',
        value: 50.50
    }],
    ['cash:"50.50"', 'parse field and float value', {
        type: 'term',
        data_type: 'string',
        field: 'cash',
        quoted: true,
        value: '50.50'
    }],
    ['bool:false', 'parse field and bool false', {
        type: 'term',
        data_type: 'boolean',
        field: 'bool',
        value: false
    }],
    ['bool:true', 'parse field and bool true', {
        type: 'term',
        data_type: 'boolean',
        field: 'bool',
        value: true
    }],
    ['fo?:bar', 'parse field name with wildcard', {
        type: 'term',
        data_type: 'string',
        field: 'fo?',
        value: 'bar'
    }]
] as TestCase[];
