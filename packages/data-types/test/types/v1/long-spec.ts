import { xLuceneFieldType } from '@terascope/types';
import LongType from '../../../src/types/v1/long';
import { FieldTypeConfig } from '../../../src/interfaces';

describe('Long V1', () => {
    const field = 'someField';
    const typeConfig: FieldTypeConfig = { type: 'Long' };

    it('can requires a field and proper configs', () => {
        const type = new LongType(field, typeConfig);
        expect(type).toBeDefined();
        expect(type.toESMapping).toBeDefined();
        expect(type.toGraphQL).toBeDefined();
        expect(type.toXlucene).toBeDefined();
    });

    it('can get proper ES Mappings', () => {
        const esMapping = new LongType(field, typeConfig).toESMapping();
        const results = { mapping: { [field]: { type: 'long' } } };

        expect(esMapping).toEqual(results);
    });

    it('can get proper ES Mappings if unindexed', () => {
        const esMapping = new LongType(field, { ...typeConfig, indexed: false }).toESMapping();
        const results = { mapping: { [field]: { type: 'long', index: false } } };

        expect(esMapping).toEqual(results);
    });

    it('can get proper graphql types', () => {
        const graphQlTypes = new LongType(field, typeConfig).toGraphQL();
        const results = { type: `${field}: Float`, customTypes: [] };

        expect(graphQlTypes).toEqual(results);
    });

    it('can get proper xlucene properties', () => {
        const xlucene = new LongType(field, typeConfig).toXlucene();
        const results = { [field]: xLuceneFieldType.Integer };

        expect(xlucene).toEqual(results);
    });
});
