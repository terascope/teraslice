
import BooleanType from '../../../src/types/versions/v1/boolean';
import { Type } from '../../../src/interfaces';
import { TSError } from '@terascope/utils';

describe('Boolean V1', () => {
    const field = 'someField';
    const typeConfig: Type = { type: 'Boolean' };

    it('can requires a field and proper configs', () => {
        try {
           // @ts-ignore
            new BooleanType();
            throw new Error('it should have errored with no configs');
        } catch (err) {
            expect(err).toBeInstanceOf(TSError);
            expect(err.message).toInclude('A field must be provided and must be of type string');
        }

        const type = new BooleanType(field, typeConfig);
        expect(type).toBeDefined();
        expect(type.toESMapping).toBeDefined();
        expect(type.toGraphQL).toBeDefined();
        expect(type.toXlucene).toBeDefined();
    });

    it('can get proper ES Mappings', () => {
        const esMapping = new BooleanType(field, typeConfig).toESMapping();
        const results = { mapping: { [field]: { type: 'boolean' } } };

        expect(esMapping).toEqual(results);
    });

    it('can get proper graphQl types', () => {
        const graphQlTypes = new BooleanType(field, typeConfig).toGraphQL();
        const results = { type: `${field}: Boolean` };

        expect(graphQlTypes).toEqual(results);
    });

    it('can get proper xlucene properties', () => {
        const xlucene = new BooleanType(field, typeConfig).toXlucene();
        const results = { [field]: 'boolean' };

        expect(xlucene).toEqual(results);
    });
});
