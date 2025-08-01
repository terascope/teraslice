import {
    DataTypeFieldConfig, FieldType, xLuceneFieldType,
    ClientMetadata,
    ElasticsearchDistribution
} from '@terascope/types';
import Vector from '../../../src/types/v1/vector.js';

describe('Vector V1', () => {
    const field = 'someField';
    const typeConfig: DataTypeFieldConfig = {
        type: FieldType.Vector,
        array: true,
        dimension: 2,
        space_type: 'l2',
        engine: 'faiss',
        name: 'hnsw'
    };

    it('can requires a field and proper configs', () => {
        const type = new Vector(field, typeConfig);

        expect(type).toBeDefined();
        expect(type.toESMapping).toBeDefined();
        expect(type.toGraphQL).toBeDefined();
        expect(type.toXlucene).toBeDefined();
    });

    it('can get proper toGraphQL types', () => {
        const type = new Vector(field, typeConfig);
        const results = type.toGraphQL();

        expect(results.customTypes).toEqual([]);
        expect(results.type).toEqual('someField: [Float]');
    });

    it('can get proper xlucene types', () => {
        const type = new Vector(field, typeConfig);
        const results = type.toXlucene();

        expect(results).toMatchObject({ someField: xLuceneFieldType.Float });
    });

    it('can get proper opensearch v3 and above mapping', () => {
        const type = new Vector(field, typeConfig);
        const { space_type, name, engine, dimension } = typeConfig;
        const config: ClientMetadata = {
            distribution: ElasticsearchDistribution.opensearch,
            version: '3.1.0',
            majorVersion: 3,
            minorVersion: 1
        };
        const { mapping, settings } = type.toESMapping(config);

        expect(mapping).toMatchObject({
            someField: {
                type: 'knn_vector',
                dimension,
                space_type,
                method: {
                    name,
                    engine
                }
            }
        });

        expect(settings).toMatchObject({ 'index.knn': true });
    });

    it('can get proper opensearch v2.10 and above until v3', () => {
        const type = new Vector(field, typeConfig);
        const { space_type, name, engine, dimension } = typeConfig;
        const clientConfig: ClientMetadata = {
            distribution: ElasticsearchDistribution.opensearch,
            version: '2.10.0',
            majorVersion: 2,
            minorVersion: 10
        };
        const { mapping, settings } = type.toESMapping(clientConfig);

        expect(mapping).toMatchObject({
            someField: {
                type: 'knn_vector',
                dimension,
                method: {
                    space_type,
                    name,
                    engine
                }
            }
        });

        expect(settings).toMatchObject({ 'index.knn': true });
    });

    it('should throw with elasticsearch and opensearch <2.10', () => {
        const type = new Vector(field, typeConfig);
        const esConfig7: ClientMetadata = {
            distribution: ElasticsearchDistribution.elasticsearch,
            version: '7.10.0',
            majorVersion: 7,
            minorVersion: 10
        };

        const esConfig8: ClientMetadata = {
            distribution: ElasticsearchDistribution.elasticsearch,
            version: '8.10.0',
            majorVersion: 8,
            minorVersion: 10
        };

        const openConfig1: ClientMetadata = {
            distribution: ElasticsearchDistribution.opensearch,
            version: '1.3.0',
            majorVersion: 1,
            minorVersion: 3
        };

        const openConfig2: ClientMetadata = {
            distribution: ElasticsearchDistribution.opensearch,
            version: '2.3.0',
            majorVersion: 2,
            minorVersion: 3
        };

        expect(() => type.toESMapping(esConfig7)).toThrow();
        expect(() => type.toESMapping(esConfig8)).toThrow();
        expect(() => type.toESMapping(openConfig1)).toThrow();
        expect(() => type.toESMapping(openConfig2)).toThrow();
    });

    it('should validate the other configs', () => {
        const clientConfig: ClientMetadata = {
            distribution: ElasticsearchDistribution.opensearch,
            version: '2.10.0',
            majorVersion: 2,
            minorVersion: 10
        };

        const badConfig1 = {
            ...typeConfig,
            dimension: 'hello'
        };
        const badConfig2 = {
            ...typeConfig,
            dimension: 2.4
        };
        const badConfig3 = {
            ...typeConfig,
            space_type: 'hello'
        };
        const badConfig4 = {
            ...typeConfig,
            name: 'hello'
        };
        const badConfig5 = {
            ...typeConfig,
            name: 'engine'
        };

        const type1 = new Vector(field, badConfig1);
        const type2 = new Vector(field, badConfig2);
        const type3 = new Vector(field, badConfig3);
        const type4 = new Vector(field, badConfig4);
        const type5 = new Vector(field, badConfig5);

        expect(() => type1.toESMapping(clientConfig)).toThrow();
        expect(() => type2.toESMapping(clientConfig)).toThrow();
        expect(() => type3.toESMapping(clientConfig)).toThrow();
        expect(() => type4.toESMapping(clientConfig)).toThrow();
        expect(() => type5.toESMapping(clientConfig)).toThrow();
    });
});
