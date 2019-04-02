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
            field: null,
            value: 'bar'
        }]
    ];

    describe.each(testCases)('when given query %j', (query, msg, ast) => {
        it(`should be able ${msg}`, () => {
            const parser = new Parser(query);
            expect(parser.ast).toMatchObject(ast);
        });
    });
});
