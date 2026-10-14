import { DuckDBConnection } from '@duckdb/node-api';
import { DuckExtensionError } from './errors.js';
import { MissingExtension } from './interfaces.js';

/**
 * The DuckDB extensions a frame needs, and how the database loads them.
 *
 * DuckDB downloads extensions from `extensions.duckdb.org` the first time a query needs one;
 * no npm install step fetches them. Without network access that download fails at the first
 * query that needs the extension rather than at startup. So every database loads them up front
 * (`loadExtensions`), and images install them at build time (`extension-tools.ts`, run from
 * `bin/duckdb-extensions.js`).
 *
 * parquet, json and icu are compiled into the binding (`STATIC_EXTENSIONS`). The four below
 * are not. `spatial` does not autoload at all: without it, `ST_Point` is a catalog error.
*/

export interface DuckExtension {
    readonly name: string;
    /** What breaks without it, for the error a missing one produces. */
    readonly reason: string;
    /** Statements run by `verify` to check that the extension actually works. */
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
        reason: 'the SQL form of the IP functions',
        check: [`SELECT '1.2.3.4'::INET`],
    },
    {
        name: 'spatial',
        reason: 'the SQL form of the geo functions, which have no JavaScript fallback',
        check: ['SELECT ST_AsText(ST_Point(1, 2))'],
    },
];

/**
 * Extensions compiled into the binding, which must never be installed: `INSTALL parquet`
 * downloads a copy that shadows the built-in one and makes `duckdb_extensions()` misreport it.
 * `install` checks they are still compiled in, so a DuckDB upgrade that drops one fails the build.
*/
export const STATIC_EXTENSIONS: readonly string[] = ['icu', 'json', 'parquet'];

/** Where the extensions live. Unset means DuckDB's default, `~/.duckdb/extensions`. */
export const EXTENSION_DIRECTORY_ENV = 'DUCKDB_EXTENSION_DIRECTORY';

/** Set to `false` in an image, so a missing extension fails at startup instead of downloading. */
export const AUTOINSTALL_EXTENSIONS_ENV = 'DUCKDB_AUTOINSTALL_EXTENSIONS';

export interface ExtensionSettings {
    extensionDirectory?: string;
    autoinstallExtensions?: boolean;
}

/**
 * Reads the extension settings from the environment.
 *
 * They are read from the environment, not only from `configureDuckDatabase`, because the
 * database may be opened by a frame before any configuration runs, and the directory must be
 * correct from the moment it opens.
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
 * Loads every required extension and throws one error naming all that are missing.
 *
 * With autoinstall on (the default, used in local development) a missing extension is installed
 * first, once per machine. With it off (in an image) nothing uses the network. Loading an
 * already-loaded extension is cheap, so calling this again is harmless.
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

/** Loads one extension. Returns the failure message, or undefined on success. */
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
