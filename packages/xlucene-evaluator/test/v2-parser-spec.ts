import 'jest-extended';
import { Parser } from '../src/parser';

describe('Parser (v2)', () => {
    it('should be able to detect bar as an entity', () => {
        const parser = new Parser('bar');
        expect(parser.ast).toMatchObject({
            type: 'term',
            data_type: 'string',
            field: null,
            value: 'bar'
        });
    });
});
