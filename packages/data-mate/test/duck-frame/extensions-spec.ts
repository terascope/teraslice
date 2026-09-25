import 'jest-extended';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import { mkdtempSync, rmSync } from 'node:fs';
import { FieldType, DataTypeConfig } from '@terascope/types';
import {
    DuckFrame, DuckExtensionError, configureDuckDatabase, closeDuckDatabase,
    extensionSettingsFromEnv, verifyExtensions, REQUIRED_EXTENSIONS,
    EXTENSION_DIRECTORY_ENV, AUTOINSTALL_EXTENSIONS_ENV
} from '../../src/duck-frame/index.js';

const CONFIG: DataTypeConfig = {
    version: 1,
    fields: { a: { type: FieldType.Keyword } },
};

/**
 * These run with the DEFAULT extension directory and autoinstall on, as local development and
 * CI do, so the first run on a machine downloads the extensions. The "missing" cases point at
 * an empty directory with autoinstall off, which is exactly an image built without them.
*/
describe('duck extensions', () => {
    let scratch: string;
    let empty: string;
    const savedEnv = {
        [EXTENSION_DIRECTORY_ENV]: process.env[EXTENSION_DIRECTORY_ENV],
        [AUTOINSTALL_EXTENSIONS_ENV]: process.env[AUTOINSTALL_EXTENSIONS_ENV],
    };

    beforeAll(() => {
        scratch = mkdtempSync(join(tmpdir(), 'duck-ext-spec-'));
        empty = mkdtempSync(join(tmpdir(), 'duck-ext-empty-'));
        delete process.env[EXTENSION_DIRECTORY_ENV];
        delete process.env[AUTOINSTALL_EXTENSIONS_ENV];
    });

    afterAll(() => {
        for (const [name, value] of Object.entries(savedEnv)) {
            if (value == null) delete process.env[name];
            else process.env[name] = value;
        }
        rmSync(scratch, { recursive: true, force: true });
        rmSync(empty, { recursive: true, force: true });
    });

    describe('extensionSettingsFromEnv', () => {
        it('is empty when nothing is set', () => {
            expect(extensionSettingsFromEnv({})).toEqual({});
        });

        it('reads the directory, ignoring a blank one', () => {
            expect(extensionSettingsFromEnv({ [EXTENSION_DIRECTORY_ENV]: '/app/ext' }))
                .toEqual({ extensionDirectory: '/app/ext' });
            expect(extensionSettingsFromEnv({ [EXTENSION_DIRECTORY_ENV]: '  ' })).toEqual({});
        });

        it.each([
            ['false', false],
            ['0', false],
            ['FALSE', false],
            ['true', true],
            ['1', true],
        ])('reads autoinstall %p as %p', (raw, expected) => {
            expect(extensionSettingsFromEnv({ [AUTOINSTALL_EXTENSIONS_ENV]: raw }))
                .toEqual({ autoinstallExtensions: expected });
        });

        it('refuses an autoinstall value it cannot read, rather than guessing', () => {
            expect(() => extensionSettingsFromEnv({ [AUTOINSTALL_EXTENSIONS_ENV]: 'no' }))
                .toThrow(/must be true or false/);
        });
    });

    describe('loading at open', () => {
        it('loads spatial with no LOAD from the caller - it never autoloads', async () => {
            const database = join(scratch, 'spatial.db');
            const frame = await DuckFrame.create(CONFIG, { database });

            expect(await frame.rawRows('SELECT ST_AsText(ST_Point(1, 2))'))
                .toEqual([['POINT (1 2)']]);

            const loaded = await frame.rawRows(
                `SELECT extension_name FROM duckdb_extensions() WHERE loaded ORDER BY 1`
            );
            expect(loaded.flat()).toIncludeAllMembers(REQUIRED_EXTENSIONS.map((e) => e.name));
            await closeDuckDatabase(database);
        }, 120_000);

        it('fails at OPEN, naming every missing extension, when autoinstall is off', async () => {
            const database = join(scratch, 'missing.db');
            const opening = configureDuckDatabase({
                database, extensionDirectory: empty, autoinstallExtensions: false,
            });

            await expect(opening).rejects.toBeInstanceOf(DuckExtensionError);
            await expect(opening).rejects.toThrow(/httpfs, aws, inet, spatial/);
            await expect(opening).rejects.toThrow(/duckdb-extensions install --dir/);
        });

        it('reads the directory and autoinstall from the environment', async () => {
            const database = join(scratch, 'env.db');
            process.env[EXTENSION_DIRECTORY_ENV] = empty;
            process.env[AUTOINSTALL_EXTENSIONS_ENV] = 'false';

            try {
                await expect(DuckFrame.create(CONFIG, { database }))
                    .rejects.toBeInstanceOf(DuckExtensionError);
            } finally {
                delete process.env[EXTENSION_DIRECTORY_ENV];
                delete process.env[AUTOINSTALL_EXTENSIONS_ENV];
            }
        });
    });

    describe('a failed open is not cached', () => {
        // MEASURED before the fix: one bad setting made every later frame, configure and close
        // on that database rethrow the same error for the life of the process.
        it('lets a frame open the database after a bad configure', async () => {
            const database = join(scratch, 'poisoned.db');

            await expect(configureDuckDatabase({ database, memoryLimit: 'bogus' })).toReject();

            const frame = await DuckFrame.create(CONFIG, { database });
            expect(await frame.size()).toEqual(0);
            await closeDuckDatabase(database);
        });

        it('retries a missing extension once the directory is fixed', async () => {
            const database = join(scratch, 'retry.db');

            await expect(configureDuckDatabase({
                database, extensionDirectory: empty, autoinstallExtensions: false,
            })).rejects.toBeInstanceOf(DuckExtensionError);

            await configureDuckDatabase({ database });
            await closeDuckDatabase(database);
        }, 120_000);

        it('closes a database whose open failed without throwing', async () => {
            const database = join(scratch, 'close-failed.db');
            const opening = configureDuckDatabase({ database, memoryLimit: 'bogus' });

            await expect(closeDuckDatabase(database)).toResolve();
            await expect(opening).toReject();
        });
    });

    describe('configuring an open database', () => {
        it('accepts the SAME directory again, so configure stays idempotent', async () => {
            // DuckDB's default location, named explicitly - populated by the opens above
            const directory = join(homedir(), '.duckdb', 'extensions');
            const database = join(scratch, 'same-dir.db');
            await configureDuckDatabase({ database, extensionDirectory: directory });

            await expect(configureDuckDatabase({ database, extensionDirectory: directory }))
                .toResolve();
            // the same directory spelled differently is still the same directory
            await expect(configureDuckDatabase({ database, extensionDirectory: `${directory}/` }))
                .toResolve();
            await expect(configureDuckDatabase({ database, memoryLimit: '1GiB' })).toResolve();
            await closeDuckDatabase(database);
        }, 120_000);

        it('refuses a DIFFERENT directory, which could never take effect', async () => {
            const database = join(scratch, 'other-dir.db');
            await DuckFrame.create(CONFIG, { database });

            await expect(configureDuckDatabase({ database, extensionDirectory: empty }))
                .rejects.toThrow(/fixed once the database opens/);
            await closeDuckDatabase(database);
        }, 120_000);
    });

    describe('verifyExtensions', () => {
        it('reports every missing extension for an empty directory', async () => {
            const report = await verifyExtensions({ directory: empty });

            expect(report.directory).toEqual(empty);
            expect(report.failures).toHaveLength(1);
            expect(report.failures[0]).toMatch(/httpfs, aws, inet, spatial/);
        });

        it('passes, with every check run, where the extensions are installed', async () => {
            // the default directory, populated by the autoinstalling opens above
            const report = await verifyExtensions();

            expect(report.failures).toEqual([]);
            expect(report.version).toMatch(/^v\d+\.\d+\.\d+/);
        }, 120_000);
    });
});
