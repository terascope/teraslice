import 'jest-extended';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { rmSync, mkdtempSync } from 'node:fs';
import { FieldType, DataTypeConfig } from '@terascope/types';
import {
    DataFrame, TealFrame, CoercionFailureError, describeColumns, diffSchema
} from '../../src/index.js';

/**
 * A `GeoJSON` field is stored as a DuckDB `GEOMETRY`, not as JSON text.
 *
 * Stored as text, every spatial query would re-parse every row. As a `GEOMETRY` the shape is
 * parsed once at ingest and is written to Parquet as GeoParquet (WKB).
 *
 * Integral coordinates render as `1.0` where `DataFrame` writes `1`, which is the same number, so
 * output is compared as parsed JSON rather than as bytes.
*/
const CONFIG: DataTypeConfig = {
    version: 1,
    fields: {
        _key: { type: FieldType.Keyword },
        shape: { type: FieldType.GeoJSON },
        shapes: { type: FieldType.GeoJSON, array: true },
        meta: { type: FieldType.Object },
        'meta.area': { type: FieldType.GeoJSON },
    },
};

const POINT = { type: 'Point', coordinates: [-90.512345, 22.534567] };
const POLYGON = {
    type: 'Polygon',
    coordinates: [
        [[0.5, 0.5], [10.5, 0.5], [10.5, 10.5], [0.5, 10.5], [0.5, 0.5]],
        [[2.5, 2.5], [4.5, 2.5], [4.5, 4.5], [2.5, 2.5]],
    ],
};
const MULTI = {
    type: 'MultiPolygon',
    coordinates: [
        [[[0.25, 0.25], [1.25, 0.25], [1.25, 1.25], [0.25, 0.25]]],
        [[[5.25, 5.25], [6.25, 5.25], [6.25, 6.25], [5.25, 5.25]]],
    ],
};

const RECORDS = [
    { _key: 'a', shape: POINT, shapes: [POINT, POLYGON], meta: { area: MULTI } },
    { _key: 'b', shape: POLYGON },
    { _key: 'c', shape: MULTI, shapes: [] },
    { _key: 'd', shape: null },
    { _key: 'e', shape: { type: 'polygon', coordinates: POLYGON.coordinates } }, // Elasticsearch spelling
];

const PRESERVE = {
    useNullForUndefined: true,
    skipNilValues: false,
    skipEmptyObjects: false,
    skipNilObjectValues: true,
    skipDuplicateObjects: false,
};

async function collect<T>(iterator: AsyncIterable<T>): Promise<T[]> {
    const out: T[] = [];
    for await (const item of iterator) out.push(item);
    return out;
}

describe('TealFrame GeoJSON stored as GEOMETRY', () => {
    let dir: string;
    let frame: TealFrame;

    beforeAll(async () => {
        dir = mkdtempSync(join(tmpdir(), 'geojson-geometry-'));
        frame = await TealFrame.fromRecords(CONFIG, RECORDS);
    });

    afterAll(async () => {
        await frame.destroy();
        rmSync(dir, { recursive: true, force: true });
    });

    it('should store a GeoJSON column as GEOMETRY, and an array of them as GEOMETRY[]', async () => {
        const columns = await describeColumns(frame);
        expect(columns).toMatchObject({ shape: 'GEOMETRY', shapes: 'GEOMETRY[]' });
        expect(columns.meta).toContain('GEOMETRY');
        expect(await diffSchema(frame)).toEqual([]);
    });

    it('should read the same shapes back through rows() as DataFrame holds', async () => {
        const rows = await collect(frame.rows());
        const reference = DataFrame.fromJSON(CONFIG, RECORDS).toJSON(PRESERVE);

        expect(rows.map((row) => row.shape)).toEqual(reference.map((row) => row.shape));
        expect(rows.map((row) => row.shapes)).toEqual(reference.map((row) => row.shapes));
        const area = (row: Record<string, any>) => row.meta?.area ?? null;
        expect(rows.map(area)).toEqual(reference.map(area));
    });

    it('should write the same shapes through ndjson() as DataFrame does', async () => {
        for (const options of [{}, { removeNullFields: false }]) {
            const lines = (await collect(frame.ndjson(options))).map((line) => JSON.parse(line));
            const reference = DataFrame.fromJSON(CONFIG, RECORDS)
                .toJSON(options.removeNullFields === false ? PRESERVE : undefined)
                .map((row) => JSON.parse(JSON.stringify(row)));

            expect(lines.map((row) => row.shape)).toEqual(reference.map((row) => row.shape));
            expect(lines.map((row) => row.shapes)).toEqual(reference.map((row) => row.shapes));
            expect(lines.map((row) => row.meta)).toEqual(reference.map((row) => row.meta));
        }
    });

    it('should cross the Parquet wire as GEOMETRY and read back unchanged', async () => {
        const file = join(dir, 'wire.parquet');
        await frame.writeParquet(file);
        const expected = await collect(frame.rows());

        const relation = await TealFrame.fromParquet(CONFIG, file);
        expect((await describeColumns(relation)).shape).toStartWith('GEOMETRY');
        expect(await diffSchema(relation)).toEqual([]);
        expect(await collect(relation.rows())).toEqual(expected);

        const table = await TealFrame.create(CONFIG);
        await table.append({ parquet: file });
        expect(await collect(table.rows())).toEqual(expected);

        await Promise.all([relation.destroy(), table.destroy()]);
    });

    it('should answer a spatial predicate on the column itself, with no parse', async () => {
        // (3, 4) is inside the polygon's shell and outside its triangular hole (y > x there)
        const inside = await frame.rawRows(
            `SELECT _key FROM ${frame.from} WHERE ST_Intersects(shape, ST_Point(3, 4)) ORDER BY _key`
        );
        expect(inside.map(([key]) => key)).toEqual(['b', 'e']);

        // (3.5, 3) is inside the hole, so no polygon contains it
        const inHole = await frame.rawRows(
            `SELECT _key FROM ${frame.from} WHERE ST_Intersects(shape, ST_Point(3.5, 3)) ORDER BY _key`
        );
        expect(inHole).toEqual([]);
    });

    it('should reject a value that is not a shape, as DataFrame does', async () => {
        const bad = [{ _key: 'x', shape: { type: 'Point', coordinates: 'nope' } }];
        expect(() => DataFrame.fromJSON(CONFIG, bad)).toThrow();
        await expect(TealFrame.fromRecords(CONFIG, bad)).rejects.toThrow(CoercionFailureError);
    });

    /**
     * Two deliberate differences from `DataFrame`, because a GEOMETRY holds only the geometry:
     *
     * - A non-canonical `type` spelling comes back canonical. `toGeoJSON` maps Elasticsearch's
     *   `'polygon'` to `'Polygon'` but leaves `'POLYGON'` as written, so `DataFrame` keeps it.
     * - Keys beside `type` and `coordinates` (a `bbox`, `properties`) are not stored.
    */
    describe('what a GEOMETRY does not keep', () => {
        it('should return a non-canonical type spelling canonically', async () => {
            const records = [{ _key: 'a', shape: { type: 'POLYGON', coordinates: POLYGON.coordinates } }];
            const subject = await TealFrame.fromRecords(CONFIG, records);
            const [row] = await collect(subject.rows()) as Record<string, any>[];
            await subject.destroy();

            expect(row.shape.type).toEqual('Polygon');
            expect(DataFrame.fromJSON(CONFIG, records).toJSON()[0].shape.type).toEqual('POLYGON');
        });

        it('should not keep keys beside type and coordinates', async () => {
            const records = [{ _key: 'a', shape: { ...POINT, bbox: [0, 0, 1, 1], properties: { a: 1 } } }];
            const subject = await TealFrame.fromRecords(CONFIG, records);
            const [row] = await collect(subject.rows());
            await subject.destroy();

            expect(row.shape).toEqual(POINT);
            expect(DataFrame.fromJSON(CONFIG, records).toJSON()[0].shape).toHaveProperty('bbox');
        });
    });
});
