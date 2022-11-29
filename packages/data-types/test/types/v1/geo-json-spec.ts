import {
    DataTypeFieldConfig,
    FieldType,
    ClientMetadata,
    ElasticsearchDistribution
} from '@terascope/types';
import GeoJSONType from '../../../src/types/v1/geo-json';

describe('GeoJSON V1', () => {
    const field = 'someField';
    const typeConfig: DataTypeFieldConfig = { type: FieldType.GeoJSON };

    let clientMetaData: ClientMetadata;

    beforeEach(() => {
        clientMetaData = {
            distribution: ElasticsearchDistribution.elasticsearch,
            majorVersion: 6,
            minorVersion: 7,
            version: '6.8.6'
        };
    });

    it('can requires a field and proper configs', () => {
        const type = new GeoJSONType(field, typeConfig);
        expect(type).toBeDefined();
        expect(type.toESMapping).toBeDefined();
        expect(type.toGraphQL).toBeDefined();
        expect(type.toXlucene).toBeDefined();
    });

    it('can get proper ES Mappings for es 6', () => {
        const esMapping = new GeoJSONType(field, typeConfig).toESMapping(clientMetaData);
        const results = {
            mapping: {
                [field]: {
                    type: 'geo_shape',
                    tree: 'quadtree',
                    strategy: 'recursive'
                }
            }
        };

        expect(esMapping).toEqual(results);
    });

    it('can get proper ES Mappings for es 7', () => {
        clientMetaData.majorVersion = 7;
        clientMetaData.minorVersion = 9;
        clientMetaData.version = '7.9.2';

        const esMapping = new GeoJSONType(field, typeConfig).toESMapping(clientMetaData);
        const results = {
            mapping: {
                [field]: {
                    type: 'geo_shape',
                    tree: 'quadtree',
                    strategy: 'recursive'
                }
            }
        };

        expect(esMapping).toEqual(results);
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
                    tree: 'quadtree',
                    strategy: 'recursive'
                }
            }
        };

        expect(esMapping).toEqual(results);
    });

    it('can get proper ES Mappings for es 8', () => {
        clientMetaData.majorVersion = 8;
        clientMetaData.minorVersion = 1;
        clientMetaData.version = '8.1.0';

        const esMapping = new GeoJSONType(field, typeConfig).toESMapping(clientMetaData);
        const results = {
            mapping: {
                [field]: { type: 'geo_shape' }
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
