import { DataTypeFieldConfig, FieldType } from '@terascope/types';
import Vector from '../../../src/types/v1/vector.js';

describe('Vector V1', () => {
    // TODO: do more
    const field = 'someField';
    const typeConfig: DataTypeFieldConfig = {
        type: FieldType.Vector,
        array: true,
        dimension: 2,
        space_type: 'l2'
    };

    it('can requires a field and proper configs', () => {
        const type = new Vector(field, typeConfig);

        expect(type).toBeDefined();
        expect(type.toESMapping).toBeDefined();
        expect(type.toGraphQL).toBeDefined();
        expect(type.toXlucene).toBeDefined();
    });

    // it('can get proper ES Mappings', () => {
    //     const esMapping = new Text(field, typeConfig).toESMapping();
    //     const results = { mapping: { [field]: { type: 'text' } } };

    //     expect(esMapping).toEqual(results);
    // });

    // it('can get proper graphql types', () => {
    //     const graphQlTypes = new Text(field, typeConfig).toGraphQL();
    //     const results = { type: `${field}: String`, customTypes: [] };

    //     expect(graphQlTypes).toEqual(results);
    // });

    // it('can get proper graphql types when given an array', () => {
    //     const graphQlTypes = new Text(field, { ...typeConfig, array: true }).toGraphQL();
    //     const results = { type: `${field}: [String]`, customTypes: [] };

    //     expect(graphQlTypes).toEqual(results);
    // });

    // it('can get proper xlucene properties', () => {
    //     const xlucene = new Text(field, typeConfig).toXlucene();
    //     const results = { [field]: 'string' };

    //     expect(xlucene).toEqual(results);
    // });
});
