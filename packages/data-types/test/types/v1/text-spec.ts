import Text from '../../../src/types/versions/v1/text';
import { TSError } from '@terascope/utils';
import { Type } from '../../../src/interfaces';

describe('Text V1', () => {
    const field = 'someField';
    const typeConfig: Type = { type: 'Text' };

    it('can requires a field and proper configs', () => {
        try {
            // @ts-ignore
            new Text();
            throw new Error('it should have errored with no configs');
        } catch (err) {
            expect(err).toBeInstanceOf(TSError);
            expect(err.message).toInclude('A field must be provided and must be of type string');
        }

        const type = new Text(field, typeConfig);
        expect(type).toBeDefined();
        expect(type.toESMapping).toBeDefined();
        expect(type.toGraphQL).toBeDefined();
        expect(type.toXlucene).toBeDefined();
    });

    it('can get proper ES Mappings', () => {
        const esMapping = new Text(field, typeConfig).toESMapping();
        const results = { mapping: { [field]: { type: 'text' } } };

        expect(esMapping).toEqual(results);
    });

    it('can get proper graphQl types', () => {
        const graphQlTypes = new Text(field, typeConfig).toGraphQL();
        const results = { type: `${field}: String` };

        expect(graphQlTypes).toEqual(results);
    });

    it('can get proper graphQl types when given an array', () => {
        const graphQlTypes = new Text(field, { ...typeConfig, array: true }).toGraphQL();
        const results = { type: `${field}: [String]` };

        expect(graphQlTypes).toEqual(results);
    });

    it('can get proper xlucene properties', () => {
        const xlucene = new Text(field, typeConfig).toXlucene();
        const results = { [field]: 'string' };

        expect(xlucene).toEqual(results);
    });
});
