import ByteType from '../../../src/types/versions/v1/byte';
import { TSError } from '@terascope/utils';
import { Type } from '../../../src/interfaces';

describe('Byte V1', () => {
    const field = 'someField';
    const typeConfig: Type = { type: 'Byte' };

    it('can requires a field and proper configs', () => {
        try {
            // @ts-ignore
            new ByteType();
            throw new Error('it should have errored with no configs');
        } catch (err) {
            expect(err).toBeInstanceOf(TSError);
            expect(err.message).toInclude('A field must be provided and must be of type string');
        }

        const type = new ByteType(field, typeConfig);
        expect(type).toBeDefined();
        expect(type.toESMapping).toBeDefined();
        expect(type.toGraphQL).toBeDefined();
        expect(type.toXlucene).toBeDefined();
    });

    it('can get proper ES Mappings', () => {
        const esMapping = new ByteType(field, typeConfig).toESMapping();
        const results = { mapping: { [field]: { type: 'byte' } } };

        expect(esMapping).toEqual(results);
    });

    it('can get proper graphQl types', () => {
        const graphQlTypes = new ByteType(field, typeConfig).toGraphQL();
        const results = { type: `${field}: Int` };

        expect(graphQlTypes).toEqual(results);
    });

    it('can get proper graphQl types when given an array', () => {
        const graphQlTypes = new ByteType(field, { ...typeConfig, array: true }).toGraphQL();
        const results = { type: `${field}: [Int]` };

        expect(graphQlTypes).toEqual(results);
    });

    it('can get proper xlucene properties', () => {
        const xlucene = new ByteType(field, typeConfig).toXlucene();
        const results = { [field]: 'number' };

        expect(xlucene).toEqual(results);
    });
});
