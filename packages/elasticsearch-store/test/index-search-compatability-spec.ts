import 'jest-extended';
import { Client } from 'elasticsearch';
import { QueryAccess, GeoShape, GeoShapeType } from 'xlucene-evaluator';
import { ESTypeMapping, DataType } from '@terascope/data-types';
import {
    IndexModel, IndexModelRecord, IndexModelConfig, IndexModelOptions
} from '../src';
import { makeClient, cleanupIndexStore } from './helpers/elasticsearch';
import { TEST_INDEX_PREFIX } from './helpers/config';

describe('IndexSearchCompatability', () => {
    const mapping: ESTypeMapping = {
        properties: {
            id: { type: 'keyword' },
            foo: { type: 'keyword' },
            group: { type: 'keyword' },
            field_one: { type: 'integer' },
            field_two: { type: 'integer' },
            word: {
                type: 'keyword',
                fields: {
                    tokens: {
                        type: 'text',
                        analyzer: 'standard',
                    },
                },
            },
            updated: { type: 'date' },
            created: { type: 'date' },
            location_one: { type: 'geo_point' },
            location_two: { type: 'geo_point' },
            shape_one: {
                type: 'geo_shape',
                tree: 'quadtree',
                strategy: 'recursive'
            },
            shape_two: {
                type: 'geo_shape',
                tree: 'quadtree',
                strategy: 'recursive'
            }
        }
    };

    interface SearchRecord extends IndexModelRecord {
        id: string;
        foo: string;
        group: string;
        word: string;
        updated: string;
        created: string;
        field_one?: number;
        field_two?: number;
        location_one?: string;
        location_two?: string;
        shape_one?: GeoShape;
        shape_two?: GeoShape;
    }

    const dataType = new DataType({
        version: 1,
        fields: {
            id: { type: 'Keyword' },
            foo: { type: 'Keyword' },
            group: { type: 'Keyword' },
            field_one: { type: 'Integer' },
            field_two: { type: 'Integer' },
            word: { type: 'KeywordTokens' },
            updated: { type: 'Date' },
            created: { type: 'Date' },
            location_one: { type: 'GeoPoint' },
            location_two: { type: 'GeoPoint' },
            shape_one: { type: 'GeoJSON' },
            shape_two: { type: 'GeoJSON' },
        }
    });

    const searchData = [
        {
            id: 'hello-1',
            foo: 'bar',
            group: 'a',
            field_one: 1234,
            updated: new Date().toISOString(),
            created: new Date().toISOString(),
            word: 'some',
            location_one: '-60,-60',
            shape_two: {
                type: GeoShapeType.MultiPolygon,
                coordinates: [
                    [
                        [[10, 10], [10, 50], [50, 50], [50, 10], [10, 10]],
                        [[20, 20], [20, 40], [40, 40], [40, 20], [20, 20]]
                    ],
                    [
                        [[-10, -10], [-10, -50], [-50, -50], [-50, -10], [-10, -10]],
                        [[-20, -20], [-20, -40], [-40, -40], [-40, -20], [-20, -20]]
                    ]
                ]
            }
        },
        {
            id: 'hello-2',
            foo: 'bar',
            group: 'a',
            field_two: 5678,
            updated: new Date().toISOString(),
            created: new Date().toISOString(),
            word: 'other',
            location_one: '15,15',
            shape_two: {
                type: GeoShapeType.Point,
                coordinates: [-30, -30]
            }
        },
        {
            id: 'hello-3',
            foo: 'baz',
            group: 'a',
            updated: new Date().toISOString(),
            created: new Date().toISOString(),
            word: 'thing',
            location_two: '-30,-50',
            shape_one: {
                type: GeoShapeType.Polygon,
                coordinates: [[[-10, -10], [-10, -50], [-50, -50], [-50, -10], [-10, -10]]]
            }
        },
        {
            id: 'hello-4',
            foo: 'hidden-group',
            group: 'b',
            field_one: 12,
            updated: new Date().toISOString(),
            created: new Date().toISOString(),
            word: 'other thing',
            location_two: '10,10',
            shape_one: {
                type: GeoShapeType.Polygon,
                coordinates: [[[20, 20], [20, 30], [30, 30], [30, 20], [20, 20]]]
            }
        }
    ];

    const client = makeClient();
    const searchConfig: IndexModelConfig<SearchRecord> = {
        name: 'search_compatability',
        mapping,
        schema: {
            properties: {
                id: {
                    type: 'string',
                },
                foo: {
                    type: 'string',
                },
                group: {
                    type: 'string',
                },
                field_one: {
                    type: 'integer',
                },
                field_two: {
                    type: 'integer',
                },
                word: {
                    type: 'string',
                },
                created: {
                    type: 'string',
                },
                updated: {
                    type: 'string',
                },
                location_one: {
                    type: 'string',
                },
                location_two: {
                    type: 'string',
                },
                shape_one: {
                    type: 'object',
                    properties: {
                        type: {
                            type: 'string',
                            enum: Object.keys(GeoShapeType)
                        },
                        coordinates: {
                            type: 'array'
                        }
                    }
                },
                shape_two: {
                    type: 'object',
                    properties: {
                        type: {
                            type: 'string',
                            enum: Object.keys(GeoShapeType)
                        },
                        coordinates: {
                            type: 'array'
                        }
                    }
                },
            },
        },
        default_sort: 'id:asc',
        unique_fields: ['id'],
        version: 1,
    };

    class SearchIndexModel extends IndexModel<SearchRecord> {
        constructor(_client: Client, options: IndexModelOptions) {
            super(_client, options, searchConfig);
        }
    }

    const indexModel = new SearchIndexModel(client, {
        namespace: `${TEST_INDEX_PREFIX}modelcompatability`,
    });

    const queryAccess = new QueryAccess({ type_config: dataType.toXlucene() });

    beforeAll(async () => {
        await cleanupIndexStore(indexModel);
        await indexModel.initialize();
        await Promise.all(searchData.map((_record) => {
            const record = Object.assign({}, _record, { client_id: 1 });
            // @ts-ignore GEOTypes issue
            return indexModel.createRecord(record);
        }));
    });

    afterAll(async () => {
        await cleanupIndexStore(indexModel);
        return indexModel.shutdown();
    });

    async function search(q: string) {
        return indexModel.search(q, { sort: 'id:asc' }, queryAccess);
    }

    describe('search compatability', () => {
        it('should be able to search with wildcard fields with a range query', async () => {
            const results = await search('field_*:>=100');
            const ids = results.map((obj) => obj.id);

            expect(results).toBeArrayOfSize(2);
            expect(ids).toEqual(['hello-1', 'hello-2']);
        });

        it('should be able to search with wildcard fields with a term query', async () => {
            const results = await search('field_*:1234');
            const ids = results.map((obj) => obj.id);

            expect(results).toBeArrayOfSize(1);
            expect(ids).toEqual(['hello-1']);
        });

        it('should be able to search with wildcard fields with a wildard query', async () => {
            const results = await search('fo*:ba?');
            const ids = results.map((obj) => obj.id);

            expect(results).toBeArrayOfSize(3);
            expect(ids).toEqual(['hello-1', 'hello-2', 'hello-3']);
        });

        it('should be able to search with wildcard fields with a regex query', async () => {
            const results = await search('fo*:/b.*/');
            const ids = results.map((obj) => obj.id);

            expect(results).toBeArrayOfSize(3);
            expect(ids).toEqual(['hello-1', 'hello-2', 'hello-3']);
        });

        it('should be able to search subfields', async () => {
            const keywordResults = await search('word:other');
            const keywordIDs = keywordResults.map((obj) => obj.id);

            expect(keywordResults).toBeArrayOfSize(1);
            expect(keywordIDs).toEqual(['hello-2']);

            const textResults = await search('word.tokens:other');
            const textIDs = textResults.map((obj) => obj.id);

            expect(textResults).toBeArrayOfSize(2);
            expect(textIDs).toEqual(['hello-2', 'hello-4']);
        });

        it('should be able to search against geo-points', async () => {
            const results = await search('location_*:geoBox(top_left: "20,0" bottom_right: "0,20")');
            const ids = results.map((obj) => obj.id);

            expect(results).toBeArrayOfSize(2);
            expect(ids).toEqual(['hello-2', 'hello-4']);
        });

        it('should be able to search against geo-shapes', async () => {
            const results = await search('shape_*:geoContainsPoint(point: "-15,-15")');
            const ids = results.map((obj) => obj.id);

            expect(results).toBeArrayOfSize(2);
            expect(ids).toEqual(['hello-1', 'hello-3']);
        });
    });
});
