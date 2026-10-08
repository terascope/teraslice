import { DuckDBConnection } from '@duckdb/node-api';
import { DuckExtensionError } from './errors.js';
import { MissingExtension } from './interfaces.js';

/**
 * The DuckDB extensions a frame needs, and how the database gets them.
 *
 * **DuckDB downloads extensions at RUNTIME** from `extensions.duckdb.org`, the first time a
 * query needs one - there is no npm install step that fetches them. On an air-gapped box that
 * download fails, and it fails at the first query that happens to need the extension, not at
 * startup. So every database LOADs these up front (`loadExtensions`) and the images install
 * them at build time (`extension-tools.ts`, run from `bin/duckdb-extensions.js`).
 *
 * MEASURED with an empty extension directory and autoinstall off: parquet, json and icu work,
 * because they are compiled into the binding (`STATIC_EXTENSIONS`); the four below fail.
 * `spatial` does not even autoload - a bare `ST_Point` is a catalog error, network or not.
*/

export interface DuckExtension {
    readonly name: string;
    /** What breaks without it, for the error a missing one produces. */
    readonly reason: string;
    /** Statements that exercise it for real, run by `verify`. Presence is not proof. */
    readonly check: readonly string[];
}

export const REQUIRED_EXTENSIONS: readonly DuckExtension[] = [
    {
        name: 'httpfs',
        reason: 's3:// and https:// reads, and CREATE SECRET',
        check: [
            `CREATE OR REPLACE TEMPORARY SECRET duck_verify_httpfs (TYPE s3, KEY_ID 'verify', SECRET 'verify')`,
            'DROP TEMPORARY SECRET duck_verify_httpfs',
        ],
    },
    {
        name: 'aws',
        reason: 'the S3 credential chain (IAM and instance roles)',
        check: [
            `CREATE OR REPLACE TEMPORARY SECRET duck_verify_aws (TYPE s3, PROVIDER credential_chain, CHAIN 'env', VALIDATION 'none')`,
            'DROP TEMPORARY SECRET duck_verify_aws',
        ],
    },
    {
        name: 'inet',
        reason: 'the IP function SQL emissions',
        check: [`SELECT '1.2.3.4'::INET`],
    },
    {
        name: 'spatial',
        reason: 'the geo function SQL emissions, which have NO UDF fallback',
        check: ['SELECT ST_AsText(ST_Point(1, 2))'],
    },
];

/**
 * Compiled into the binding, so NEVER installed: `INSTALL parquet` downloads a repository copy
 * that SHADOWS the built-in one and makes `duckdb_extensions()` misreport it. `install`
 * asserts they are still static, so a DuckDB upgrade that unlinks one fails the build.
*/
export const STATIC_EXTENSIONS: readonly string[] = ['icu', 'json', 'parquet'];

/** Where the extensions live. Unset means DuckDB's default, `~/.duckdb/extensions`. */
export const EXTENSION_DIRECTORY_ENV = 'DUCKDB_EXTENSION_DIRECTORY';

/** `false` in an image, so a missing file fails at startup rather than trying the network. */
export const AUTOINSTALL_EXTENSIONS_ENV = 'DUCKDB_AUTOINSTALL_EXTENSIONS';

export interface ExtensionSettings {
    extensionDirectory?: string;
    autoinstallExtensions?: boolean;
}

/**
 * The extension settings an image sets through its environment.
 *
 * These come from the environment rather than only from `configureDuckDatabase`, because a
 * database is opened by whichever call reaches it FIRST - often a frame, before any
 * configuration runs - and the directory has to be right from the moment it opens.
*/
export function extensionSettingsFromEnv(
    env: NodeJS.ProcessEnv = process.env
): ExtensionSettings {
    const directory = env[EXTENSION_DIRECTORY_ENV]?.trim();
    const autoinstall = parseBoolean(
        AUTOINSTALL_EXTENSIONS_ENV, env[AUTOINSTALL_EXTENSIONS_ENV]
    );

    return {
        ...(directory && { extensionDirectory: directory }),
        ...(autoinstall != null && { autoinstallExtensions: autoinstall }),
    };
}

function parseBoolean(name: string, raw: string | undefined): boolean | undefined {
    const value = raw?.trim().toLowerCase();
    if (!value) return undefined;
    if (value === 'true' || value === '1') return true;
    if (value === 'false' || value === '0') return false;
    throw new TypeError(`${name} must be true or false, got "${raw}"`);
}

/**
 * LOADs every required extension, and throws ONE error naming all that are missing.
 *
 * With autoinstall on (the default, and local development) a missing extension is installed
 * first, once per machine. With it off (an image) nothing touches the network. A LOAD of an
 * already-loaded extension costs ~0.3 ms, so running this again is harmless.
*/
export async function loadExtensions(
    connection: DuckDBConnection,
    autoinstall: boolean
): Promise<void> {
    const missing: MissingExtension[] = [];

    for (const extension of REQUIRED_EXTENSIONS) {
        const failure = await loadOne(connection, extension.name, autoinstall);
        if (failure) missing.push({ ...extension, error: failure });
    }

    if (missing.length === 0) return;

    const [[version, platform, directory]] = (await (await connection.run(
        `SELECT version(), (SELECT platform FROM pragma_platform()),`
        + ` current_setting('extension_directory')`
    )).getRowsJson()) as string[][];

    throw new DuckExtensionError({
        missing, version, platform, directory: directory || '~/.duckdb/extensions', autoinstall,
    });
}

/** The failure message, or undefined once the extension is loaded. */
async function loadOne(
    connection: DuckDBConnection,
    name: string,
    autoinstall: boolean
): Promise<string | undefined> {
    try {
        await connection.run(`LOAD ${name}`);
        return undefined;
    } catch (err) {
        if (!autoinstall) return firstLine(err);
    }

    try {
        await connection.run(`INSTALL ${name}`);
        await connection.run(`LOAD ${name}`);
        return undefined;
    } catch (err) {
        return firstLine(err);
    }
}

export function firstLine(err: unknown): string {
    const message = err instanceof Error ? err.message : String(err);
    return message.split('\n')[0];
}
