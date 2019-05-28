import Boundry from '../../../src/types/versions/v1/boundary';
import { TSError } from '@terascope/utils';
import { TypeConfig, ElasticSearchTypes } from '../../../src/interfaces';

describe('Boundary V1', () => {
    const field = 'someField';
    const typeConfig: TypeConfig = { type: 'Boundry' };

    it('can requires a field and proper configs', () => {
        try {
           // @ts-ignore
            new Boundry();
            throw new Error('it should have errored with no configs');
        } catch (err) {
            expect(err).toBeInstanceOf(TSError);
            expect(err.message).toInclude('A field must be provided and must be of type string');
        }

        const type = new Boundry(field, typeConfig);
        expect(type).toBeDefined();
        expect(type.toESMapping).toBeDefined();
        expect(type.toGraphQl).toBeDefined();
        expect(type.toXlucene).toBeDefined();
    });

    it('can get proper ES Mappings', () => {
        const esMapping = new Boundry(field, typeConfig).toESMapping();
        const results = {
            mapping: {
                [field]:{
                    properties: {
                        lat: { type: 'float' as ElasticSearchTypes },
                        lon: { type: 'float' as ElasticSearchTypes }
                    }
                }
            }
        };

        expect(esMapping).toEqual(results);
    });

    it('can get proper graphQl types', () => {
        const { type: graphQlTypes, custom_type: customType } = new Boundry(field, typeConfig).toGraphQl();
        const results = `${field}: Geo`;

        expect(graphQlTypes).toEqual(results);
        expect(customType.match('type GeoNumb {')).not.toBeNull();
        expect(customType.match('lat: Int!')).not.toBeNull();
        expect(customType.match('lon: Int!')).not.toBeNull();
    });

    it('can get proper xlucene properties', () => {
        const xlucene = new Boundry(field, typeConfig).toXlucene();
        const results = { [field]: 'geo' };

        expect(xlucene).toEqual(results);
    });
});
