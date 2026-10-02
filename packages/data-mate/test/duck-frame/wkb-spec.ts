import 'jest-extended';
import { DuckDBInstance, DuckDBConnection } from '@duckdb/node-api';
import { GeoShape, GeoShapeType } from '@terascope/types';
import { geoShapeToWKB, wkbToGeoShape } from '../../src/duck-frame/wkb.js';

/**
 * The GeoJSON <-> WKB codec a `GeoJSON` column is ingested and read through.
 *
 * **Proved against DuckDB itself, byte for byte**: for every shape the encoder's output must equal
 * `ST_AsWKB(ST_GeomFromGeoJSON(...))`, so what lands in a `GEOMETRY` column is exactly what DuckDB
 * would have made from the same GeoJSON.
*/
const SHAPES: readonly GeoShape[] = [
    { type: GeoShapeType.Point, coordinates: [-90.5, 22.5] },
    { type: GeoShapeType.Point, coordinates: [1.123456789012345, -2.000000000000001] },
    {
        type: GeoShapeType.Polygon,
        coordinates: [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]],
    },
    {
        type: GeoShapeType.Polygon, // with a hole
        coordinates: [
            [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]],
            [[2, 2], [4, 2], [4, 4], [2, 2]],
        ],
    },
    {
        type: GeoShapeType.MultiPolygon,
        coordinates: [
            [[[0, 0], [1, 0], [1, 1], [0, 0]]],
            [[[5, 5], [6, 5], [6, 6], [5, 5]], [[5.2, 5.2], [5.4, 5.2], [5.4, 5.4], [5.2, 5.2]]],
        ],
    },
];

describe('WKB codec', () => {
    let connection: DuckDBConnection;

    beforeAll(async () => {
        const instance = await DuckDBInstance.create(':memory:');
        connection = await instance.connect();
        await connection.run('LOAD spatial');
    });

    afterAll(() => {
        connection.closeSync();
    });

    async function duckdbWKB(shape: GeoShape): Promise<Uint8Array> {
        const literal = JSON.stringify(shape).replace(/'/g, '\'\'');
        const reader = await connection.runAndReadAll(
            `SELECT ST_AsWKB(ST_GeomFromGeoJSON('${literal}'))`
        );
        const [[blob]] = reader.getRows() as [[{ bytes: Uint8Array }]];
        return blob.bytes;
    }

    it.each(SHAPES.map((shape) => [shape.type, shape]))(
        'should encode a %s byte-for-byte as DuckDB does',
        async (_type, shape) => {
            expect(Buffer.from(geoShapeToWKB(shape))).toEqual(Buffer.from(await duckdbWKB(shape)));
        }
    );

    it.each(SHAPES.map((shape) => [shape.type, shape]))(
        'should decode DuckDB\'s WKB for a %s back to the same shape',
        async (_type, shape) => {
            expect(wkbToGeoShape(await duckdbWKB(shape))).toEqual(shape);
        }
    );

    it('should decode big-endian WKB too, which other producers may write', () => {
        // Point(1.5 -2.5), byte order 0
        const bytes = new Uint8Array(21);
        const view = new DataView(bytes.buffer);
        view.setUint8(0, 0);
        view.setUint32(1, 1, false);
        view.setFloat64(5, 1.5, false);
        view.setFloat64(13, -2.5, false);

        expect(wkbToGeoShape(bytes))
            .toEqual({ type: GeoShapeType.Point, coordinates: [1.5, -2.5] });
    });

    describe('what it accepts', () => {
        it('should take the Elasticsearch lowercase spelling as the same shape', () => {
            const es = { type: 'polygon', coordinates: SHAPES[2].coordinates } as unknown as GeoShape;
            expect(geoShapeToWKB(es)).toEqual(geoShapeToWKB(SHAPES[2]));
        });

        it.each([
            ['an unknown type', { type: 'LineString', coordinates: [[0, 0], [1, 1]] }],
            ['a position with a third ordinate', { type: 'Point', coordinates: [1, 2, 3] }],
            ['a non-numeric ordinate', { type: 'Point', coordinates: [1, 'x'] }],
            ['a polygon ring that is not an array', { type: 'Polygon', coordinates: [5] }],
        ])('should reject %s rather than store something else', (_label, shape) => {
            expect(() => geoShapeToWKB(shape as unknown as GeoShape)).toThrow(TypeError);
        });

        it('should reject WKB of a geometry type a GeoShape cannot hold', () => {
            // LineString, type 2
            const bytes = new Uint8Array(9);
            const view = new DataView(bytes.buffer);
            view.setUint8(0, 1);
            view.setUint32(1, 2, true);
            expect(() => wkbToGeoShape(bytes)).toThrow(TypeError);
        });
    });
});
