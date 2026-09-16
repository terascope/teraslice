import 'jest-extended';
import { FieldType, GeoShapeType } from '@terascope/types';
import { DataType, LATEST_VERSION } from '@terascope/data-types';
import { QueryAccess } from '../../src/query-access/index.js';
import { DuckTestDB } from './duckdb-helpers.js';

/**
 * The geo queries from `test/query/geo-spec.ts`, on the same shapes, run against DuckDB.
 *
 * **These need the `spatial` extension, which does NOT autoload** - a geo query without it
 * is a catalog error, not a slow path - and they are where the two engines are most likely
 * to disagree, because each brings its own geometry implementation. Where an expectation
 * differs from the OpenSearch one, the comment says why.
*/
describe('geo queries (duckdb)', () => {
    const table = 'geo_search';
    let db: DuckTestDB;

    const dataType = new DataType({
        version: LATEST_VERSION,
        fields: {
            id: { type: FieldType.Keyword },
            location: { type: FieldType.GeoPoint },
            geoShape: { type: FieldType.GeoJSON },
        }
    });

    const bigPolygon = [[[0, 0], [100, 0], [100, 60], [0, 60], [0, 0]]];
    const hole = [[10, 10], [90, 10], [90, 50], [10, 50], [10, 10]];
    const square = [[[40, 40], [50, 40], [50, 50], [40, 50], [40, 40]]];
    const farSquare = [[[-40, -40], [-50, -40], [-50, -50], [-40, -50], [-40, -40]]];

    const searchData = [
        { id: '1', location: { lat: 20, lon: 20 } },
        { id: '2', location: { lat: 90, lon: 20 } },
        { id: '3', geoShape: JSON.stringify({ type: GeoShapeType.Point, coordinates: [20, 20] }) },
        { id: '4', geoShape: JSON.stringify({ type: GeoShapeType.Point, coordinates: [5, 5] }) },
        { id: '5', geoShape: JSON.stringify({ type: GeoShapeType.Polygon, coordinates: square }) },
        { id: '6', geoShape: JSON.stringify({ type: GeoShapeType.Polygon, coordinates: bigPolygon }) },
        { id: '7', geoShape: JSON.stringify({ type: GeoShapeType.Polygon, coordinates: [...bigPolygon, hole] }) },
        { id: '8', geoShape: JSON.stringify({ type: GeoShapeType.Polygon, coordinates: farSquare }) },
    ];

    const access = new QueryAccess({
        prevent_prefix_wildcard: true,
        allow_implicit_queries: true,
        allow_empty_queries: true,
        type_config: dataType.toXlucene(),
        filterNilVariables: true,
        variables: undefined
    });

    async function search(query: string, variables?: Record<string, any>): Promise<string[]> {
        const sql = await access.restrictSQLQuery(query, { variables, params: { table } });
        const rows = await db.run(sql);
        return rows.map((row) => row.id as string);
    }

    beforeAll(async () => {
        db = await DuckTestDB.create();
        await db.createTable(table, dataType, searchData);
    });

    afterAll(async () => {
        await db.close();
    });

    describe('geoDistance', () => {
        it('can do geoDistance queries on geo-points', async () => {
            await expect(search('location:geoDistance(point:"20,20" distance:5000m)')).resolves.toEqual(['1']);
        });

        it('measures in the unit the query asked for', async () => {
            await expect(search('location:geoDistance(point:"20,20" distance:1mi)')).resolves.toEqual(['1']);
            await expect(search('location:geoDistance(point:"21,20" distance:200km)')).resolves.toEqual(['1']);
            await expect(search('location:geoDistance(point:"21,20" distance:50km)')).resolves.toEqual([]);
        });

        /** The function also produces the ordering, as it does for the Elasticsearch DSL. */
        it('returns a distance sort', async () => {
            const { sort } = await access.restrictSQLParts(
                'location:geoDistance(point:"20,20" distance:100000km)'
            );

            expect(sort).toHaveLength(1);
            expect(sort?.[0].order).toEqual('asc');
            await expect(search('location:geoDistance(point:"20,20" distance:100000km)'))
                .resolves.toEqual(['1', '2']);
        });
    });

    describe('geoBox', () => {
        it('can do geoBox queries on geo-points', async () => {
            await expect(search('location:geoBox(top_left:"40,0", bottom_right:"0,40")')).resolves.toEqual(['1']);
        });

        /**
         * A box is boundary-INCLUSIVE, which is why it is emitted as arithmetic: DuckDB's
         * `ST_Within` excludes the boundary and would drop this record.
        */
        it('includes a point on the boundary', async () => {
            await expect(search('location:geoBox(top_left:"20,20", bottom_right:"0,40")')).resolves.toEqual(['1']);
        });
    });

    describe('geoContainsPoint', () => {
        it('finds the shapes containing the point', async () => {
            await expect(search('geoShape:geoContainsPoint(point:"20,20")')).resolves.toEqual(['3', '6']);
        });

        /** The point sits inside the hole, so the polygon does not contain it. */
        it('respects a hole', async () => {
            await expect(search('geoShape:geoContainsPoint(point:"5,5")')).resolves.toEqual(['4', '6', '7']);
        });
    });

    describe('geoPolygon', () => {
        const point = { type: GeoShapeType.Point, coordinates: [20, 20] };
        const polygon = { type: GeoShapeType.Polygon, coordinates: square };
        const far = { type: GeoShapeType.Polygon, coordinates: farSquare };
        const big = { type: GeoShapeType.Polygon, coordinates: bigPolygon };
        const holed = { type: GeoShapeType.Polygon, coordinates: [...bigPolygon, hole] };

        describe('contains', () => {
            it('with a point', async () => {
                await expect(search('geoShape:geoPolygon(points:$shape, relation: contains)', { shape: point }))
                    .resolves.toEqual(['3', '6']);
            });

            /**
             * **A shape contains itself, and record 5 IS the query square.**
             *
             * OpenSearch answers this one with the big polygon alone; `ST_Contains` applies OGC
             * semantics, where a geometry contains an identical geometry. The SQL answer is the
             * geometrically correct one, and this is the first of two places these tests assert
             * it over the OpenSearch answer - the other is `within` with a holed polygon.
            */
            it('with a polygon', async () => {
                await expect(search('geoShape:geoPolygon(points:$shape, relation: contains)', { shape: polygon }))
                    .resolves.toEqual(['5', '6']);
            });
        });

        describe('intersects', () => {
            it('with a point', async () => {
                await expect(search('geoShape:geoPolygon(points:$shape, relation: intersects)', { shape: point }))
                    .resolves.toEqual(['3', '6']);
            });

            it('with a polygon', async () => {
                await expect(search('geoShape:geoPolygon(points:$shape, relation: intersects)', { shape: polygon }))
                    .resolves.toEqual(['5', '6', '7']);
            });

            it('with a polygon that matches only itself', async () => {
                await expect(search('geoShape:geoPolygon(points:$shape, relation: intersects)', { shape: far }))
                    .resolves.toEqual(['8']);
            });
        });

        describe('disjoint', () => {
            it('with a point', async () => {
                await expect(search('geoShape:geoPolygon(points:$shape, relation: disjoint)', { shape: point }))
                    .resolves.toEqual(['4', '5', '7', '8']);
            });

            it('with a polygon', async () => {
                const inner = {
                    type: GeoShapeType.Polygon,
                    coordinates: [[[40, 40], [45, 40], [45, 45], [40, 45], [40, 40]]]
                };
                await expect(search('geoShape:geoPolygon(points:$shape, relation: disjoint)', { shape: inner }))
                    .resolves.toEqual(['3', '4', '7', '8']);
            });
        });

        describe('within', () => {
            it('with a point, which only the same point is within', async () => {
                await expect(search('geoShape:geoPolygon(points:$shape, relation: within)', { shape: point }))
                    .resolves.toEqual(['3']);
            });

            it('with a polygon', async () => {
                await expect(search('geoShape:geoPolygon(points:$shape, relation: within)', { shape: big }))
                    .resolves.toEqual(['3', '4', '5', '6', '7']);
            });

            /**
             * Record 7 is the query shape itself, and a shape is within itself.
             *
             * OpenSearch leaves it out here while including the identical shape in the test
             * above, which is its own inconsistency about holes in a QUERY shape; `ST_Within`
             * treats both the same way.
            */
            it('with a polygon that has holes', async () => {
                await expect(search('geoShape:geoPolygon(points:$shape, relation: within)', { shape: holed }))
                    .resolves.toEqual(['4', '7']);
            });
        });

        /** A points list, rather than a GeoJSON shape, is the other way to write one. */
        it('takes a list of points', async () => {
            await expect(search('geoShape:geoPolygon(points:["0,0", "0,100", "60,100", "60,0"])'))
                .resolves.toEqual(['3', '4', '5', '6', '7']);
        });

        it('works against a geo-point field', async () => {
            await expect(search('location:geoPolygon(points:["0,0", "0,100", "60,100", "60,0"])'))
                .resolves.toEqual(['1']);
        });
    });

    describe('combined with other queries', () => {
        it('can be negated', async () => {
            await expect(search('NOT location:geoBox(top_left:"40,0", bottom_right:"0,40")'))
                .resolves.toEqual(['2', '3', '4', '5', '6', '7', '8']);
        });

        it('can be combined with a term query', async () => {
            await expect(search('id:1 AND location:geoBox(top_left:"40,0", bottom_right:"0,40")'))
                .resolves.toEqual(['1']);
        });
    });
});
