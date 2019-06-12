
import FloatType from '../../../src/types/versions/v1/float';
import { TSError } from '@terascope/utils';
import { Type } from '../../../src/interfaces';

describe('Float V1', () => {
    const field = 'someField';
    const typeConfig: Type = { type: 'Float' };

    it('can requires a field and proper configs', () => {
        try {
           // @ts-ignore
            new FloatType();
            throw new Error('it should have errored with no configs');
        } catch (err) {
            expect(err).toBeInstanceOf(TSError);
            expect(err.message).toInclude('A field must be provided and must be of type string');
        }

        const type = new FloatType(field, typeConfig);
        expect(type).toBeDefined();
        expect(type.toESMapping).toBeDefined();
        expect(type.toGraphQL).toBeDefined();
        expect(type.toXlucene).toBeDefined();
    });

    it('can get proper ES Mappings', () => {
        const esMapping = new FloatType(field, typeConfig).toESMapping();
        const results = { mapping: { [field]: { type: 'float' } } };

        expect(esMapping).toEqual(results);
    });

    it('can get proper graphQl types', () => {
        const graphQlTypes = new FloatType(field, typeConfig).toGraphQL();
        const results = { type: `${field}: Float` };

        expect(graphQlTypes).toEqual(results);
    });

    it('can get proper xlucene properties', () => {
        const xlucene = new FloatType(field, typeConfig).toXlucene();
        const results = { [field]: 'float' };

        expect(xlucene).toEqual(results);
    });
});
