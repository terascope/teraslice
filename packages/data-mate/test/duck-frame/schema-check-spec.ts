import 'jest-extended';
import { FieldType, DataTypeConfig } from '@terascope/types';
import { DuckFrame, closeDuckDatabase } from '../../src/duck-frame/DuckFrame.js';
import { describeColumns, diffSchema } from '../../src/duck-frame/schema-check.js';

const CONFIG: DataTypeConfig = {
    version: 1,
    fields: {
        name: { type: FieldType.Keyword },
        bytes: { type: FieldType.Integer },
        created: { type: FieldType.Date },
        loc: { type: FieldType.GeoPoint },
        tags: { type: FieldType.Keyword, array: true },
    },
};

const RECORDS = [
    {
        name: 'a', bytes: 100, created: '2026-01-02T03:04:05.000Z', loc: '22.5,-90.1', tags: ['x']
    },
    {
        name: 'b', bytes: 300, created: '2026-01-02T04:04:05.000Z', loc: '33.5,-80.1', tags: ['y']
    },
];

const only = (type: FieldType, field = 'bytes'): DataTypeConfig => ({
    version: 1, fields: { [field]: { type } },
});

describe('schema-check', () => {
    let frame: DuckFrame;

    beforeAll(async () => {
        frame = await DuckFrame.fromRecords(CONFIG, RECORDS, {});
    });

    afterAll(async () => {
        await closeDuckDatabase();
    });

    describe('describeColumns', () => {
        it('reports the real DuckDB type of every column', async () => {
            expect(await describeColumns(frame)).toEqual({
                name: 'VARCHAR',
                bytes: 'BIGINT',
                created: 'TIMESTAMP',
                loc: 'STRUCT(lat DOUBLE, lon DOUBLE)',
                tags: 'VARCHAR[]',
            });
        });

        it('works on a relation, not just a table', async () => {
            const relation = frame.filter('bytes > 100');
            expect(relation.isMaterialized).toBeFalse();
            expect(await describeColumns(relation)).toMatchObject({ bytes: 'BIGINT' });
        });
    });

    describe('what it reports', () => {
        it('leads with the FieldType, keeping DuckDB types as diagnostic detail only', async () => {
            const lying = frame.select(
                { bytes: 'CAST(bytes AS VARCHAR)' }, only(FieldType.Integer)
            );
            const [mismatch] = await diffSchema(lying);

            // FieldType is the system's language; the DuckDB type is nested under `storage`
            expect(mismatch.declared).toEqual(FieldType.Integer);
            expect(mismatch.storage).toEqual({ declared: 'BIGINT', actual: 'VARCHAR' });
        });

        it('does not invent an "actual FieldType", because that is not knowable', async () => {
            // VARCHAR is Keyword, Text, IP, Binary and more - there is no reverse mapping
            const lying = frame.select(
                { bytes: 'CAST(bytes AS VARCHAR)' }, only(FieldType.Integer)
            );
            const [mismatch] = await diffSchema(lying);
            expect(Object.keys(mismatch)).not.toContain('actual');
        });
    });

    describe('diffSchema', () => {
        it('finds nothing when the config matches, which is the ingest case', async () => {
            expect(await diffSchema(frame)).toEqual([]);
        });

        it('finds nothing after a filter, which does not change types', async () => {
            expect(await diffSchema(frame.filter('bytes > 100'))).toEqual([]);
        });

        it('catches a projection whose SQL contradicts its declared type', async () => {
            // declares Integer (BIGINT) but produces VARCHAR
            const lying = frame.select(
                { bytes: 'CAST(bytes AS VARCHAR)' }, only(FieldType.Integer)
            );

            expect(await diffSchema(lying)).toEqual([{
                column: 'bytes',
                declared: FieldType.Integer,
                kind: 'type',
                storage: { declared: 'BIGINT', actual: 'VARCHAR' },
            }]);
        });

        it('catches DuckDB promoting an aggregate past its declared type', async () => {
            // THE case this helper exists for: DuckDB widens sum(BIGINT) to HUGEINT, so a
            // config still claiming Integer is wrong. An explicit CAST is what fixes it.
            const summed = frame.select(
                { bytes: 'sum(bytes)' }, only(FieldType.Integer)
            );

            expect(await diffSchema(summed)).toEqual([{
                column: 'bytes',
                declared: FieldType.Integer,
                kind: 'type',
                storage: { declared: 'BIGINT', actual: 'HUGEINT' },
            }]);
        });

        it('is clean once the aggregate is CAST to the declared type', async () => {
            // Long is HUGEINT, which is what data-mate's rules say sum(Integer) produces
            const summed = frame.select(
                { bytes: 'CAST(sum(bytes) AS HUGEINT)' }, only(FieldType.Long)
            );
            expect(await diffSchema(summed)).toEqual([]);
        });

        it('reports a declared column that does not exist as missing', async () => {
            const projected = frame.select({ name: 'name' }, {
                version: 1,
                fields: { name: { type: FieldType.Keyword }, gone: { type: FieldType.Integer } },
            });

            expect(await diffSchema(projected)).toEqual([{
                column: 'gone',
                declared: FieldType.Integer,
                kind: 'missing',
                storage: { declared: 'BIGINT' },
            }]);
        });

        it('reports a produced column that was never declared as unexpected', async () => {
            const extra = frame.select(
                { bytes: 'bytes', surprise: 'name' }, only(FieldType.Integer)
            );

            expect(await diffSchema(extra)).toEqual([{
                column: 'surprise', kind: 'unexpected', storage: { actual: 'VARCHAR' },
            }]);
        });

        it('compares structured types by their rendered form', async () => {
            const geo = frame.select({ loc: 'loc' }, only(FieldType.GeoPoint, 'loc'));
            expect(await diffSchema(geo)).toEqual([]);
        });
    });
});
