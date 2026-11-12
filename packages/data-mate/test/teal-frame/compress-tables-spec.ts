import 'jest-extended';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mkdtempSync, rmSync } from 'node:fs';
import { FieldType, DataTypeConfig } from '@terascope/types';
import { TealFrame, configureDuckDatabase, closeDuckDatabase } from '../../src/index.js';

const CONFIG: DataTypeConfig = {
    version: 1,
    fields: { _key: { type: FieldType.Keyword }, bytes: { type: FieldType.Integer } },
};

const RECORDS = [{ _key: 'a', bytes: 1 }, { _key: 'b', bytes: 2 }];

/** The catalog a frame's table was made in. */
async function catalogOf(frame: TealFrame): Promise<string> {
    const rows = await frame.rawRows(
        `SELECT database_name FROM duckdb_tables() WHERE table_name = '${frame.table}'`
    );
    return String(rows[0]?.[0]);
}

describe('compressTables', () => {
    // the in-memory database is process-wide, so this file opens it compressed
    beforeAll(async () => {
        await configureDuckDatabase({ compressTables: true });
    });

    afterAll(async () => {
        await closeDuckDatabase();
    });

    it('makes the tables in the compressed catalog', async () => {
        const frame = await TealFrame.fromRecords(CONFIG, RECORDS);
        expect(await catalogOf(frame)).toEqual('teal_compressed');
        await frame.destroy();
    });

    it('appends, streams and derives on the connections of their own', async () => {
        const frame = await TealFrame.create(CONFIG);
        await Promise.all([
            frame.append({ records: RECORDS }),
            frame.append({ records: [{ _key: 'c', bytes: 3 }] }),
        ]);

        const rows: Record<string, unknown>[] = [];
        for await (const row of frame.orderBy([{ expression: '_key' }]).rows({})) rows.push(row);
        expect(rows).toEqual([
            { _key: 'a', bytes: 1 }, { _key: 'b', bytes: 2 }, { _key: 'c', bytes: 3 },
        ]);

        const lines: string[] = [];
        for await (const line of frame.filter('bytes > 1').ndjson()) lines.push(line);
        expect(lines.sort()).toEqual(['{"_key":"b","bytes":2}', '{"_key":"c","bytes":3}']);

        const materialized = await frame.filter('bytes = 3').materialize();
        expect(await catalogOf(materialized)).toEqual('teal_compressed');
        expect(await materialized.size()).toEqual(1);

        await Promise.all([frame.destroy(), materialized.destroy()]);
    });

    // only with COMPRESS does DuckDB compress an in-memory table as it grows
    it('stores the rows of a growing table compressed', async () => {
        const frame = await TealFrame.create({
            version: 1,
            fields: {
                k: { type: FieldType.Keyword },
                n: { type: FieldType.Integer },
                s: { type: FieldType.Keyword },
            },
        });
        try {
            for (let batch = 0; batch < 100; batch++) {
                await frame.append({
                    records: Array.from({ length: 10_000 }, (_, i) => ({
                        k: 'same', n: i % 7, s: `value-${i % 50}`,
                    })),
                });
            }
            const rows = await frame.rawRows(
                `SELECT DISTINCT compression FROM pragma_storage_info('${frame.table}')`
            );
            const kinds = rows.map(([kind]) => String(kind));
            expect(kinds.filter((kind) => kind !== 'Uncompressed')).not.toBeEmpty();
            expect(await frame.size()).toEqual(1_000_000);
        } finally {
            await frame.destroy();
        }
    });

    it('cannot be turned off once the database is open', async () => {
        await expect(configureDuckDatabase({ compressTables: false })).rejects.toThrow(
            /compressTables is fixed once the database opens/
        );
    });

    it('is refused for a database file, which is always compressed', async () => {
        const scratch = mkdtempSync(join(tmpdir(), 'duck-compress-spec-'));
        try {
            await expect(configureDuckDatabase({
                database: join(scratch, 'file.db'), compressTables: true,
            })).rejects.toThrow(/is a file and is always compressed/);
        } finally {
            rmSync(scratch, { recursive: true, force: true });
        }
    });
});
