import 'jest-extended';
import { Parser, V2AST } from '../src/parser';

describe('Parser (v2)', () => {
    const testCases: ([string, string, V2AST])[] = [
        ['bar', 'parse an implicit string', {
            type: 'term',
            data_type: 'string',
            field: null,
            value: 'bar'
        }]
    ];
    describe.each(testCases)('when given %s', (query, msg, ast) => {
        it(`should be able ${msg}`, () => {
            const parser = new Parser(query);
            expect(parser.ast).toMatchObject(ast);
        });
    });
});
