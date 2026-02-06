import {
    DataTypeFieldConfig, FieldType, ClientMetadata,
    ElasticsearchDistribution
} from '@terascope/types';
import GeoJSONType from '../../../src/types/v1/geo-json.js';

describe('GeoJSON V1', () => {
    const field = 'someField';
    const typeConfig: DataTypeFieldConfig = { type: FieldType.GeoJSON };

    let clientMetaData: ClientMetadata;

    beforeEach(() => {
        clientMetaData = {
            distribution: ElasticsearchDistribution.opensearch,
            majorVersion: 2,
            minorVersion: 15,
            version: '2.15.0'
        };
    });

    it('can get proper Index Mappings for es opensearch', () => {
        clientMetaData = {
            distribution: ElasticsearchDistribution.opensearch,
            majorVersion: 1,
            minorVersion: 0,
            version: '1.0.0'
        };

        const esMapping = new GeoJSONType(field, typeConfig).toESMapping(clientMetaData);
        const results = {
            mapping: {
                [field]: {
                    type: 'geo_shape',
                }
            }
        };

        expect(esMapping).toEqual(results);
    });

    it('can get proper Index Mappings for es opensearch2', () => {
        clientMetaData = {
            distribution: ElasticsearchDistribution.opensearch,
            majorVersion: 2,
            minorVersion: 15,
            version: '2.15.0'
        };

        const esMapping = new GeoJSONType(field, typeConfig).toESMapping(clientMetaData);
        const results = {
            mapping: {
                [field]: {
                    type: 'geo_shape',
                }
            }
        };

        expect(esMapping).toEqual(results);
    });

    it('can get proper graphql types', () => {
        const { type: graphQlTypes } = new GeoJSONType(field, typeConfig).toGraphQL();
        const results = `${field}: GeoJSON`;

        expect(graphQlTypes).toEqual(results);
    });

    it('can get proper xlucene properties', () => {
        const xlucene = new GeoJSONType(field, typeConfig).toXlucene();
        const results = { [field]: 'geo-json' };

        expect(xlucene).toEqual(results);
    });
});
