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
        ['"foo"', 'parse an quoted string', {
            type: 'term',
            data_type: 'string',
            field: null,
            quoted: true,
            value: 'foo'
        }],
        ['foo:bar', 'parse field and string value', {
            type: 'term',
            data_type: 'string',
            field: 'foo',
            quoted: false,
            value: 'bar'
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
        ['fo?:bar', 'parse field name with wildcard', {
            type: 'term',
            data_type: 'string',
            field: 'fo?',
            value: 'bar'
        }],
        ['hi:the?e', 'parse value with wildcard', {
            type: 'term',
            data_type: 'wildcard',
            field: 'hi',
            value: 'the?e'
        }],
    ];

    describe.each(testCases)('when given query %j', (query, msg, ast) => {
        it(`should be able ${msg}`, () => {
            const parser = new Parser(query);
            expect(parser.ast).toMatchObject(ast);
        });
    });
});
