import 'jest-extended';
import { Parser, V2AST } from '../src/parser';

describe('Parser (v2)', () => {
    type TestCase = [
        // when give query %s
        string,
        // it should be able %s
        string,
        // toMatchObject(%j)
        V2AST
    ];

    const testCases: (TestCase)[] = [
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
        ['count:123', 'parse field and number value', {
            type: 'term',
            data_type: 'number',
            field: 'count',
            value: 123
        }],
        ['count:"123"', 'parse field and number value', {
            type: 'term',
            data_type: 'string',
            field: 'count',
            quoted: true,
            value: '123'
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
        }],
        ['hi:the?e', 'parse value with ? wildcard', {
            type: 'wildcard',
            data_type: 'string',
            field: 'hi',
            value: 'the?e'
        }],
        ['hi:?here', 'parse value with a prefix wildcard', {
            type: 'wildcard',
            data_type: 'string',
            field: 'hi',
            value: '?here'
        }],
        ['hi:ther*', 'parse value with a * wildcard', {
            type: 'wildcard',
            data_type: 'string',
            field: 'hi',
            value: 'ther*'
        }],
        ['hi:the?*', 'parse value with a * and ? wildcard', {
            type: 'wildcard',
            data_type: 'string',
            field: 'hi',
            value: 'the?*'
        }],
        ['hi:th?r*', 'parse value with a * and ? wildcard', {
            type: 'wildcard',
            data_type: 'string',
            field: 'hi',
            value: 'th?r*'
        }],
        ['example:/[a-z]+/', 'parse a basic regexp', {
            type: 'regexp',
            data_type: 'string',
            field: 'example',
            value: '[a-z]+'
        }],
        ['example:/foo:bar/', 'parse a regexp with a colon', {
            type: 'regexp',
            data_type: 'string',
            field: 'example',
            value: 'foo:bar'
        }],
        ['example:/0-9+\\//', 'parse regex with an escaped forward slash', {
            type: 'regexp',
            data_type: 'string',
            field: 'example',
            value: '0-9+\\/'
        }],
    ];

    describe.each(testCases)('when given query %s', (query, msg, ast) => {
        it(`should be able ${msg}`, () => {
            const parser = new Parser(query);
            expect(parser.ast).toMatchObject(ast);
        });
    });
});
