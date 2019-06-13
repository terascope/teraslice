import Boundary from '../../../src/types/versions/v1/boundary';
import { TSError } from '@terascope/utils';
import { Type, ElasticSearchTypes } from '../../../src/interfaces';

describe('Boundary V1', () => {
    const field = 'someField';
    const typeConfig: Type = { type: 'Boundary' };

    it('can requires a field and proper configs', () => {
        try {
            // @ts-ignore
            new Boundary();
            throw new Error('it should have errored with no configs');
        } catch (err) {
            expect(err).toBeInstanceOf(TSError);
            expect(err.message).toInclude('A field must be provided and must be of type string');
        }

        const type = new Boundary(field, typeConfig);
        expect(type).toBeDefined();
        expect(type.toESMapping).toBeDefined();
        expect(type.toGraphQL).toBeDefined();
        expect(type.toXlucene).toBeDefined();
    });

    it('can get proper ES Mappings', () => {
        const esMapping = new Boundary(field, typeConfig).toESMapping();
        const results = {
            mapping: {
                [field]: {
                    properties: {
                        lat: { type: 'float' as ElasticSearchTypes },
                        lon: { type: 'float' as ElasticSearchTypes },
                    },
                },
            },
        };

        expect(esMapping).toEqual(results);
    });

    it('can get proper graphQl types', () => {
        const { type: graphQlTypes, custom_type: customType } = new Boundary(field, typeConfig).toGraphQL();
        const results = `${field}: GeoBoundaryType`;

        expect(graphQlTypes).toEqual(results);
        expect(customType).toInclude('type GeoBoundaryType {');
        expect(customType).toInclude('lat: Int!');
        expect(customType).toInclude('lon: Int!');
    });

    it('can get proper xlucene properties', () => {
        const xlucene = new Boundary(field, typeConfig).toXlucene();
        const results = { [field]: 'geo' };

        expect(xlucene).toEqual(results);
    });
});
