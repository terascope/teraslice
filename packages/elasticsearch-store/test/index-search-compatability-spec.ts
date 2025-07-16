import 'jest-extended';
import { FieldType, GeoShape, GeoShapeType } from '@terascope/types';
import { QueryAccess } from 'xlucene-translator';
import { Client, ElasticsearchTestHelpers } from '@terascope/opensearch-client';
import {
    IndexModel, IndexModelRecord, IndexModelConfig,
    IndexModelOptions, makeRecordDataType
} from '../src/index.js';
import { cleanupIndexStore } from './helpers/utils.js';

const { makeClient, TEST_INDEX_PREFIX } = ElasticsearchTestHelpers;

describe('IndexSearchCompatability', () => {
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

    const dataType = makeRecordDataType({
        name: 'SearchCompatibility',
        fields: {
            id: { type: FieldType.Keyword },
            foo: { type: FieldType.Keyword },
            group: { type: FieldType.Keyword },
            field_one: { type: FieldType.Integer },
            field_two: { type: FieldType.Integer },
            word: { type: FieldType.KeywordTokens },
            updated: { type: FieldType.Date },
            created: { type: FieldType.Date },
            location_one: { type: FieldType.GeoPoint },
            location_two: { type: FieldType.GeoPoint },
            shape_one: { type: FieldType.GeoJSON },
            shape_two: { type: FieldType.GeoJSON },
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

    const searchConfig: IndexModelConfig<SearchRecord> = {
        name: 'search_compatability',
        data_type: dataType,
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

    let indexModel: SearchIndexModel;

    const queryAccess = new QueryAccess({ type_config: dataType.toXlucene() });

    beforeAll(async () => {
        const client = await makeClient();

        indexModel = new SearchIndexModel(client, {
            namespace: `${TEST_INDEX_PREFIX}modelcompatability`,
        });
        await cleanupIndexStore(indexModel);
        await indexModel.initialize();
        await Promise.all(searchData.map((_record) => {
            const record = Object.assign({}, _record, { client_id: 1 });
            return indexModel.createRecord(record as any);
        }));
    });

    afterAll(async () => {
        await cleanupIndexStore(indexModel);
        return indexModel.shutdown();
    });

    async function search(q: string) {
        const { results } = await indexModel.search(q, { sort: 'id:asc' }, queryAccess);
        return results;
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
