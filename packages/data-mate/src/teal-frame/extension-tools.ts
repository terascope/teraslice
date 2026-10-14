import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DuckDBConnection, DuckDBInstance } from '@duckdb/node-api';
import { quoteLiteral } from '@terascope/sql-builder';
import { DuckContext } from './DuckContext.js';
import {
    extensionSettingsFromEnv, firstLine, REQUIRED_EXTENSIONS, STATIC_EXTENSIONS
} from './extensions.js';

/**
 * Installs and verifies the DuckDB extensions while a Docker image is built, much as
 * `node-pre-gyp install` fetches the kafka client's native binary during `pnpm install`.
 *
 * Running inside the target platform's build container lets DuckDB pick the right platform
 * (`linux_amd64_musl` in the teraslice image). Using this package's `@duckdb/node-api` keeps
 * the extension version in step with the binding.
*/

export interface ExtensionReport {
    version: string;
    platform: string;
    /** Always set; DuckDB's default when nothing was configured. */
    directory: string;
    /** One line per failed extension. Always empty from `install`; `verify` fails if not. */
    failures: string[];
}

export interface InstallOptions {
    /** Defaults to `DUCKDB_EXTENSION_DIRECTORY`, then DuckDB's `~/.duckdb/extensions`. */
    directory?: string;
    /**
     * An internal mirror, as a URL or a local directory laid out as
     * `<repository>/v1.5.5/<platform>/<name>.duckdb_extension.gz`. Defaults to DuckDB's own.
    */
    repository?: string;
}

/**
 * Downloads the required extensions into `directory`. Throws on the first failure, so the
 * image build stops there.
 *
 * It first checks that `STATIC_EXTENSIONS` are still compiled in, so a DuckDB upgrade that
 * drops one fails the build rather than a machine without network access.
*/
export async function installExtensions(options: InstallOptions = {}): Promise<ExtensionReport> {
    await assertStaticExtensions();

    const directory = options.directory ?? extensionSettingsFromEnv().extensionDirectory;
    const instance = await DuckDBInstance.create(':memory:', {
        ...(directory != null && { extension_directory: directory }),
    });

    try {
        const connection = await instance.connect();
        const from = options.repository ? ` FROM ${quoteLiteral(options.repository)}` : '';

        for (const { name } of REQUIRED_EXTENSIONS) {
            await connection.run(`INSTALL ${name}${from}`);
            await connection.run(`LOAD ${name}`);
        }
        return { ...(await describe(connection)), failures: [] };
    } finally {
        instance.closeSync();
    }
}

/**
 * Checks that the extensions work without network access. Opens a database as production does,
 * with autoinstall off, and runs each extension's check. Run it in the image's runtime stage so
 * it tests the shipped files with their real ownership and permissions.
*/
export async function verifyExtensions(
    options: Pick<InstallOptions, 'directory'> = {}
): Promise<ExtensionReport> {
    let context: DuckContext;
    try {
        context = await DuckContext.create(':memory:', {
            ...(options.directory != null && { extensionDirectory: options.directory }),
            autoinstallExtensions: false,
        });
    } catch (err) {
        // DuckExtensionError already names every missing extension and where it looked
        return { ...(await describeDefaults(options.directory)), failures: [firstLine(err)] };
    }

    try {
        const failures: string[] = [];
        for (const { name, check } of REQUIRED_EXTENSIONS) {
            try {
                for (const sql of check) await context.run(sql);
            } catch (err) {
                failures.push(`${name}: ${firstLine(err)}`);
            }
        }
        return { ...(await describe(context.connection)), failures };
    } finally {
        context.disconnect();
    }
}

/**
 * Throws if any `STATIC_EXTENSIONS` entry is no longer compiled in. Uses an empty extension
 * directory, because a downloaded copy would shadow the built-in one and
 * `duckdb_extensions()` would report it as a repository install.
*/
async function assertStaticExtensions(): Promise<void> {
    const empty = mkdtempSync(join(tmpdir(), 'duckdb-static-'));
    const instance = await DuckDBInstance.create(':memory:', {
        extension_directory: empty,
        autoinstall_known_extensions: 'false',
    });

    try {
        const connection = await instance.connect();
        const rows = (await (await connection.run(
            `SELECT extension_name FROM duckdb_extensions() WHERE install_mode = 'STATICALLY_LINKED'`
        )).getRowsJson()) as string[][];
        const linked = new Set(rows.map(([name]) => name));
        const unlinked = STATIC_EXTENSIONS.filter((name) => !linked.has(name));

        if (unlinked.length > 0) {
            throw new Error(
                `${unlinked.join(', ')} are no longer compiled into this DuckDB. Add them to`
                + ' REQUIRED_EXTENSIONS in extensions.ts, or they will fail offline.'
            );
        }
    } finally {
        instance.closeSync();
        rmSync(empty, { recursive: true, force: true });
    }
}

async function describe(
    connection: DuckDBConnection
): Promise<Omit<ExtensionReport, 'failures'>> {
    const [[version, platform, directory]] = (await (await connection.run(
        `SELECT version(), (SELECT platform FROM pragma_platform()),`
        + ` current_setting('extension_directory')`
    )).getRowsJson()) as string[][];

    return { version, platform, directory: directory || '~/.duckdb/extensions' };
}

/** Describes DuckDB for a report when the configured database could not open. */
async function describeDefaults(
    directory: string | undefined
): Promise<Omit<ExtensionReport, 'failures'>> {
    const instance = await DuckDBInstance.create(':memory:');
    try {
        const described = await describe(await instance.connect());
        return {
            ...described,
            directory: directory
                ?? extensionSettingsFromEnv().extensionDirectory
                ?? described.directory,
        };
    } finally {
        instance.closeSync();
    }
}
