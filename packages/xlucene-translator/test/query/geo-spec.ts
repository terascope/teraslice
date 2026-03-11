import { type Client, ElasticsearchTestHelpers, getClientMetadata } from '@terascope/opensearch-client';
import { FieldType, type ClientMetadata, GeoShapeType } from '@terascope/types';
import { DataType, LATEST_VERSION } from '@terascope/data-types';
import { QueryAccess } from '../../src/query-access/index.js';

const { makeClient, populateIndex, cleanupIndex } = ElasticsearchTestHelpers;

describe('geo queries', () => {
    const index = 'geo_search_';
    let client: Client;
    let clientMetadata: ClientMetadata | undefined;

    const dataType = new DataType({
        version: LATEST_VERSION,
        fields: {
            location: { type: FieldType.GeoPoint },
            geoShape: { type: FieldType.GeoJSON }
        }
    });

    const searchData = [
        { location: '20,20' },
        { location: '90,20' },
        {
            geoShape: {
                type: GeoShapeType.Point,
                coordinates: [20, 20]
            },
        },
        {
            geoShape: {
                type: GeoShapeType.Point,
                coordinates: [5, 5]
            },
        },
        {
            geoShape: {
                type: GeoShapeType.Polygon,
                coordinates: [[[40, 40], [50, 40], [50, 50], [40, 50], [40, 40]]]
            },
        },
        {
            geoShape: {
                type: GeoShapeType.Polygon,
                coordinates: [[[0, 0], [100, 0], [100, 60], [0, 60], [0, 0]]]
            },
        },
        {
            geoShape: {
                type: GeoShapeType.Polygon,
                coordinates: [
                    [[0, 0], [100, 0], [100, 60], [0, 60], [0, 0]],
                    [[10, 10], [90, 10], [90, 50], [10, 50], [10, 10]]
                ]
            },
        },
        {
            geoShape: {
                type: GeoShapeType.Polygon,
                coordinates: [[[-40, -40], [-50, -40], [-50, -50], [-40, -50], [-40, -40]]]
            },
        },
    ];

    const access = new QueryAccess(
        {
            prevent_prefix_wildcard: true,
            allow_implicit_queries: true,
            allow_empty_queries: true,
            type_config: dataType.toXlucene(),
            filterNilVariables: true,
            variables: undefined
        }
    );

    beforeAll(async () => {
        client = await makeClient();
        clientMetadata = getClientMetadata(client);

        await populateIndex(client, index, dataType, searchData);
    });

    afterAll(async () => {
        await cleanupIndex(client, index);
    });

    describe('geoDistance', () => {
        it('can do geoDistance queries on geo-points', async () => {
            const searchParams = await access.restrictSearchQuery(
                'location:geoDistance(point:"20,20" distance:5000m)',
                { ...clientMetadata, params: { index, size: searchData.length } }
            );

            const response = await client.search(searchParams);

            const results = response.hits.hits.map((record) => record._source);

            expect(results.length).toEqual(1);
            expect(results).toMatchObject([
                { location: '20,20' },
            ]);
        });
    });

    describe('geoBox', () => {
        it('can do geoBox queries on geo-points', async () => {
            const searchParams = await access.restrictSearchQuery(
                'location:geoBox(top_left:"40,0", bottom_right:"0,40")',
                { ...clientMetadata, params: { index, size: searchData.length } }
            );

            const response = await client.search(searchParams);

            const results = response.hits.hits.map((record) => record._source);

            expect(results.length).toEqual(1);
            expect(results).toMatchObject([
                { location: '20,20' },
            ]);
        });
    });

    describe('geoContainsPoint', () => {
        it('can do geoContainsPoint on geo-points', async () => {
            const searchParams = await access.restrictSearchQuery(
                'geoShape:geoContainsPoint(point:"20,20")',
                { ...clientMetadata, params: { index, size: searchData.length } }
            );

            const response = await client.search(searchParams);
            const results = response.hits.hits.map((record) => record._source);

            expect(results).toMatchObject([
                { geoShape: { type: 'Point', coordinates: [20, 20] } },
                {
                    geoShape: {
                        type: 'Polygon',
                        coordinates: [[[0, 0], [100, 0], [100, 60], [0, 60], [0, 0]]]
                    }
                }
            ]);
        });
    });

    describe('geoPolygon', () => {
        describe('can do "contains" queries', () => {
            it('with geo shape points', async () => {
                const searchParams = await access.restrictSearchQuery(
                    'geoShape:geoPolygon(points:$shape, relation: contains)',
                    {
                        ...clientMetadata,
                        params: { index, size: searchData.length },
                        variables: {
                            shape: {
                                type: GeoShapeType.Point,
                                coordinates: [20, 20]
                            },
                        }
                    }
                );

                const response = await client.search(searchParams);

                const results = response.hits.hits.map((record) => record._source);

                expect(results.length).toEqual(2);
                expect(results).toMatchObject([
                    {
                        geoShape: {
                            type: GeoShapeType.Point,
                            coordinates: [20, 20]
                        },
                    },
                    {
                        geoShape: {
                            type: GeoShapeType.Polygon,
                            coordinates: [[[0, 0], [100, 0], [100, 60], [0, 60], [0, 0]]]
                        },
                    },
                ]);
            });

            it('with geoShape Polygons', async () => {
                const searchParams = await access.restrictSearchQuery(
                    'geoShape:geoPolygon(points:$shape, relation: contains)',
                    {
                        ...clientMetadata,
                        params: { index, size: searchData.length },
                        variables: {
                            shape: {
                                type: GeoShapeType.Polygon,
                                coordinates: [
                                    [[40, 40], [50, 40], [50, 50], [40, 50], [40, 40]]
                                ]
                            },
                        }
                    }
                );

                const response = await client.search(searchParams);

                const results = response.hits.hits.map((record) => record._source);

                expect(results.length).toEqual(1);
                expect(results).toMatchObject([
                    {
                        geoShape: {
                            type: GeoShapeType.Polygon,
                            coordinates: [[[0, 0], [100, 0], [100, 60], [0, 60], [0, 0]]]
                        },
                    },
                ]);
            });
        });

        describe('can do "intersect" queries', () => {
            it('with geo shape points', async () => {
                const searchParams = await access.restrictSearchQuery(
                    'geoShape:geoPolygon(points:$shape, relation: intersects)',
                    {
                        ...clientMetadata,
                        params: { index, size: searchData.length },
                        variables: {
                            shape: {
                                type: GeoShapeType.Point,
                                coordinates: [20, 20]
                            },
                        }
                    }
                );

                const response = await client.search(searchParams);

                const results = response.hits.hits.map((record) => record._source);

                expect(results.length).toEqual(2);
                expect(results).toMatchObject([
                    {
                        geoShape: {
                            type: GeoShapeType.Point,
                            coordinates: [20, 20]
                        },
                    },
                    {
                        geoShape: {
                            type: GeoShapeType.Polygon,
                            coordinates: [[[0, 0], [100, 0], [100, 60], [0, 60], [0, 0]]]
                        },
                    },
                ]);
            });

            it('with geo shape polygons', async () => {
                const searchParams = await access.restrictSearchQuery(
                    'geoShape:geoPolygon(points:$shape, relation: intersects)',
                    {
                        ...clientMetadata,
                        params: { index, size: searchData.length },
                        variables: {
                            shape: {
                                type: GeoShapeType.Polygon,
                                coordinates: [
                                    [[40, 40], [50, 40], [50, 50], [40, 50], [40, 40]]
                                ]
                            },
                        }
                    }
                );

                const response = await client.search(searchParams);

                const results = response.hits.hits.map((record) => record._source);

                expect(results.length).toEqual(3);
                expect(results).toMatchObject([
                    {
                        geoShape: {
                            type: GeoShapeType.Polygon,
                            coordinates: [[[40, 40], [50, 40], [50, 50], [40, 50], [40, 40]]]
                        },
                    },
                    {
                        geoShape: {
                            type: GeoShapeType.Polygon,
                            coordinates: [[[0, 0], [100, 0], [100, 60], [0, 60], [0, 0]]]
                        },
                    },
                    {
                        geoShape: {
                            type: GeoShapeType.Polygon,
                            coordinates: [
                                [[0, 0], [100, 0], [100, 60], [0, 60], [0, 0]],
                                [[10, 10], [90, 10], [90, 50], [10, 50], [10, 10]]
                            ]
                        },
                    },
                ]);
            });

            it('with geo shape polygons that don\'t match, except to itself', async () => {
                const searchParams = await access.restrictSearchQuery(
                    'geoShape:geoPolygon(points:$shape, relation: intersects)',
                    {
                        ...clientMetadata,
                        params: { index, size: searchData.length },
                        variables: {
                            shape: {
                                type: GeoShapeType.Polygon,
                                coordinates: [
                                    [[-40, -40], [-50, -40], [-50, -50], [-40, -50], [-40, -40]]
                                ]
                            },
                        }
                    }
                );

                const response = await client.search(searchParams);

                const results = response.hits.hits.map((record) => record._source);

                expect(results).toMatchObject([
                    {
                        geoShape: {
                            type: GeoShapeType.Polygon,
                            coordinates: [
                                [[-40, -40], [-50, -40], [-50, -50], [-40, -50], [-40, -40]]
                            ]
                        },
                    }
                ]);
            });
        });

        describe('can do "disjoint" queries', () => {
            it('with geo shape points', async () => {
                const searchParams = await access.restrictSearchQuery(
                    'geoShape:geoPolygon(points:$shape, relation: disjoint)',
                    {
                        ...clientMetadata,
                        params: { index, size: searchData.length },
                        variables: {
                            shape: {
                                type: GeoShapeType.Point,
                                coordinates: [20, 20]
                            },
                        }
                    }
                );

                const response = await client.search(searchParams);

                const results = response.hits.hits.map((record) => record._source);

                expect(results).toMatchObject([
                    {
                        geoShape: {
                            type: 'Point',
                            coordinates: [5, 5]
                        }
                    },
                    {
                        geoShape: {
                            type: 'Polygon',
                            coordinates: [
                                [
                                    [40, 40],
                                    [50, 40],
                                    [50, 50],
                                    [40, 50],
                                    [40, 40]
                                ]
                            ]
                        }
                    },
                    {
                        geoShape: {
                            type: 'Polygon',
                            coordinates: [
                                [[0, 0], [100, 0], [100, 60], [0, 60], [0, 0]],
                                [
                                    [10, 10],
                                    [90, 10],
                                    [90, 50],
                                    [10, 50],
                                    [10, 10]
                                ]
                            ]
                        }
                    },
                    {
                        geoShape: {
                            type: 'Polygon',
                            coordinates: [
                                [
                                    [-40, -40],
                                    [-50, -40],
                                    [-50, -50],
                                    [-40, -50],
                                    [-40, -40]
                                ]
                            ]
                        }
                    }
                ]);
            });

            it('with geo shape polygons', async () => {
                const searchParams = await access.restrictSearchQuery(
                    'geoShape:geoPolygon(points:$shape, relation: disjoint)',
                    {
                        ...clientMetadata,
                        params: { index, size: searchData.length },
                        variables: {
                            shape: {
                                type: GeoShapeType.Polygon,
                                coordinates: [
                                    [[40, 40], [45, 40], [45, 45], [40, 45], [40, 40]]
                                ]
                            },
                        }
                    }
                );

                const response = await client.search(searchParams);

                const results = response.hits.hits.map((record) => record._source);

                expect(results).toMatchObject([
                    {
                        geoShape: {
                            type: 'Point',
                            coordinates: [20, 20]
                        }
                    },
                    {
                        geoShape: {
                            type: 'Point',
                            coordinates: [5, 5]
                        }
                    },
                    {
                        geoShape: {
                            type: 'Polygon',
                            coordinates: [
                                [[0, 0], [100, 0], [100, 60], [0, 60], [0, 0]],
                                [
                                    [10, 10],
                                    [90, 10],
                                    [90, 50],
                                    [10, 50],
                                    [10, 10]
                                ]
                            ]
                        }
                    },
                    {
                        geoShape: {
                            type: 'Polygon',
                            coordinates: [
                                [
                                    [-40, -40],
                                    [-50, -40],
                                    [-50, -50],
                                    [-40, -50],
                                    [-40, -40]
                                ]
                            ]
                        }
                    },
                ]);
            });
        });

        describe('can do "within" queries', () => {
            it('with geo shape points only to itself', async () => {
                const searchParams = await access.restrictSearchQuery(
                    'geoShape:geoPolygon(points:$shape, relation: within)',
                    {
                        ...clientMetadata,
                        params: { index, size: searchData.length },
                        variables: {
                            shape: {
                                type: GeoShapeType.Point,
                                coordinates: [20, 20]
                            },
                        }
                    }
                );

                const response = await client.search(searchParams);

                const results = response.hits.hits.map((record) => record._source);
                expect(results).toMatchObject([
                    {
                        geoShape: {
                            type: GeoShapeType.Point,
                            coordinates: [20, 20]
                        },
                    },
                ]);
            });

            it('with geo shape polygons', async () => {
                const searchParams = await access.restrictSearchQuery(
                    'geoShape:geoPolygon(points:$shape, relation: within)',
                    {
                        ...clientMetadata,
                        params: { index, size: searchData.length },
                        variables: {
                            shape: {
                                type: GeoShapeType.Polygon,
                                coordinates: [[[0, 0], [100, 0], [100, 60], [0, 60], [0, 0]]]
                            },
                        }
                    }
                );

                const response = await client.search(searchParams);

                const results = response.hits.hits.map((record) => record._source);

                expect(results).toMatchObject([
                    {
                        geoShape: {
                            type: 'Point',
                            coordinates: [20, 20]
                        }
                    },
                    {
                        geoShape: {
                            type: 'Point',
                            coordinates: [5, 5]
                        }
                    },
                    {
                        geoShape: {
                            type: 'Polygon',
                            coordinates: [
                                [
                                    [40, 40],
                                    [50, 40],
                                    [50, 50],
                                    [40, 50],
                                    [40, 40]
                                ]
                            ]
                        }
                    },
                    {
                        geoShape: {
                            type: 'Polygon',
                            coordinates: [[[0, 0], [100, 0], [100, 60], [0, 60], [0, 0]]]
                        }
                    },
                    {
                        geoShape: {
                            type: 'Polygon',
                            coordinates: [
                                [[0, 0], [100, 0], [100, 60], [0, 60], [0, 0]],
                                [
                                    [10, 10],
                                    [90, 10],
                                    [90, 50],
                                    [10, 50],
                                    [10, 10]
                                ]
                            ]
                        }
                    }
                ]);
            });

            it('with geo shape polygons with holes', async () => {
                const searchParams = await access.restrictSearchQuery(
                    'geoShape:geoPolygon(points:$shape, relation: within)',
                    {
                        ...clientMetadata,
                        params: { index, size: searchData.length },
                        variables: {
                            shape: {
                                type: GeoShapeType.Polygon,
                                coordinates: [
                                    [[0, 0], [100, 0], [100, 60], [0, 60], [0, 0]],
                                    [[10, 10], [90, 10], [90, 50], [10, 50], [10, 10]]
                                ]
                            },
                        }
                    }
                );

                const response = await client.search(searchParams);

                const results = response.hits.hits.map((record) => record._source);

                expect(results).toMatchObject([
                    {
                        geoShape: {
                            type: 'Point',
                            coordinates: [5, 5]
                        }
                    },
                ]);
            });
        });
    });
});
