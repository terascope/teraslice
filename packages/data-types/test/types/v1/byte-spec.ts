import { xLuceneFieldType } from '@terascope/types';
import ByteType from '../../../src/types/v1/byte';
import { FieldTypeConfig } from '../../../src/interfaces';

describe('Byte V1', () => {
    const field = 'someField';
    const typeConfig: FieldTypeConfig = { type: 'Byte' };

    it('can requires a field and proper configs', () => {
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

    it('can get proper ES Mappings if unindexed', () => {
        const esMapping = new ByteType(field, { ...typeConfig, indexed: false }).toESMapping();
        const results = { mapping: { [field]: { type: 'byte', index: false } } };

        expect(esMapping).toEqual(results);
    });

    it('can get proper graphql types', () => {
        const graphQlTypes = new ByteType(field, typeConfig).toGraphQL();
        const results = { type: `${field}: Int`, customTypes: [] };

        expect(graphQlTypes).toEqual(results);
    });

    it('can get proper graphql types when given an array', () => {
        const graphQlTypes = new ByteType(field, { ...typeConfig, array: true }).toGraphQL();
        const results = { type: `${field}: [Int]`, customTypes: [] };

        expect(graphQlTypes).toEqual(results);
    });

    it('can get proper xlucene properties', () => {
        const xlucene = new ByteType(field, typeConfig).toXlucene();
        const results = { [field]: xLuceneFieldType.Integer };

        expect(xlucene).toEqual(results);
    });
});
