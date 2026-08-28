import 'jest-extended';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
    existsSync, rmSync, mkdtempSync, readdirSync
} from 'node:fs';
import { FieldType, DataTypeConfig } from '@terascope/types';
import {
    DuckFrame, configureDuckDatabase, closeDuckDatabase
} from '../../src/duck-frame/DuckFrame.js';

const CONFIG: DataTypeConfig = {
    version: 1,
    fields: { _key: { type: FieldType.Keyword }, bytes: { type: FieldType.Integer } },
};

const RECORDS = [{ _key: 'a', bytes: 1 }, { _key: 'b', bytes: 2 }];

/** Reads a DuckDB setting back out. */
async function setting(frame: DuckFrame, name: string): Promise<string> {
    const rows = await frame.query(
        `SELECT value FROM duckdb_settings() WHERE name = '${name}'`
    );
    return String(rows[0]?.[0] ?? '');
}

describe('duck database', () => {
    let scratch: string;

    beforeAll(() => {
        scratch = mkdtempSync(join(tmpdir(), 'duck-db-spec-'));
    });

    afterAll(() => {
        rmSync(scratch, { recursive: true, force: true });
    });

    describe('`:memory:` versus a file path', () => {
        // MEASURED, and it bit us: a bare name and the `:memory:<name>` form BOTH write a
        // database file into the working directory. Only the exact string `:memory:` is
        // in-memory. These tests pin that so nobody "isolates" a test by naming a database
        // and quietly litters the repo root.
        it('writes no file for the default `:memory:` database', async () => {
            const before = readdirSync(scratch);
            const frame = await DuckFrame.fromRecords(CONFIG, RECORDS, {});
            expect(await frame.size()).toEqual(2);
            expect(readdirSync(scratch)).toEqual(before);
            await frame.destroy();
        });

        it('writes a real file for a path, and the table survives reopening it', async () => {
            const path = join(scratch, 'real.db');
            expect(existsSync(path)).toBeFalse();

            const frame = await DuckFrame.fromRecords(
                CONFIG, RECORDS, { database: path, name: 'persisted' }
            );
            const table = frame.table!;
            expect(await frame.size()).toEqual(2);
            expect(existsSync(path)).toBeTrue();

            // close the database, then open the same path again
            await closeDuckDatabase(path);
            const reopened = await DuckFrame.fromRecords(
                CONFIG, RECORDS, { database: path, name: 'second' }
            );

            // the first frame's table is still there, with its rows.
            // NOTE query() is JSON-rendered, so a BIGINT count comes back as a string.
            expect(await reopened.query(`SELECT count(*) FROM ${table}`)).toEqual([['2']]);
            await closeDuckDatabase(path);
        });

        it('treats `:memory:<name>` as a FILE PATH, not a named memory database', async () => {
            const named = join(scratch, ':memory:trap');
            const frame = await DuckFrame.fromRecords(
                CONFIG, RECORDS, { database: named, name: 'trap' }
            );
            await frame.size();
            // this is the trap: it looks in-memory and is not
            expect(existsSync(named)).toBeTrue();
            await closeDuckDatabase(named);
        });

        it('keeps separate databases isolated from each other', async () => {
            const a = join(scratch, 'a.db');
            const b = join(scratch, 'b.db');

            const frameA = await DuckFrame.fromRecords(
                CONFIG, RECORDS, { database: a, name: 'only_in_a' }
            );
            const frameB = await DuckFrame.fromRecords(
                CONFIG, RECORDS, { database: b, name: 'only_in_b' }
            );

            await expect(frameB.query(`SELECT * FROM ${frameA.table}`)).toReject();

            await closeDuckDatabase(a);
            await closeDuckDatabase(b);
        });
    });

    describe('configureDuckDatabase — spill and resource settings', () => {
        it('points spill at a real directory, which is what file overflow needs', async () => {
            const database = join(scratch, 'spill.db');
            const spill = join(scratch, 'spill-dir');

            await configureDuckDatabase({
                database,
                tempDirectory: spill,
                maxTempDirectorySize: '2GiB',
                memoryLimit: '512MiB',
            });

            const frame = await DuckFrame.fromRecords(
                CONFIG, RECORDS, { database, name: 'spilled' }
            );

            expect(await setting(frame, 'temp_directory')).toEqual(spill);
            // NOTE DuckDB reads `GB` as 10^9 and reports in GiB, so '2GB' comes back as
            // '1.8 GiB'. Binary units are used here so the assertion is unambiguous.
            expect(await setting(frame, 'max_temp_directory_size')).toEqual('2.0 GiB');
            expect(await setting(frame, 'memory_limit')).toEqual('512.0 MiB');

            await closeDuckDatabase(database);
        });

        it('updates an already-open database, since these are runtime SETs', async () => {
            const database = join(scratch, 'reconfig.db');
            await configureDuckDatabase({ database, memoryLimit: '1GiB' });

            const frame = await DuckFrame.fromRecords(
                CONFIG, RECORDS, { database, name: 'reconfigured' }
            );
            expect(await setting(frame, 'memory_limit')).toEqual('1.0 GiB');

            await configureDuckDatabase({ database, memoryLimit: '2GiB', threads: 3 });
            expect(await setting(frame, 'memory_limit')).toEqual('2.0 GiB');
            expect(await setting(frame, 'threads')).toEqual('3');

            await closeDuckDatabase(database);
        });

        it('escapes a path containing a quote rather than breaking the SET', async () => {
            const database = join(scratch, 'quoted.db');
            const spill = join(scratch, 'it\'s-a-dir');
            await configureDuckDatabase({ database, tempDirectory: spill });

            const frame = await DuckFrame.fromRecords(
                CONFIG, RECORDS, { database, name: 'quoted' }
            );
            expect(await setting(frame, 'temp_directory')).toEqual(spill);

            await closeDuckDatabase(database);
        });
    });
});
