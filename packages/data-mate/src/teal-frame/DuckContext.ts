import {
    DuckDBInstance, DuckDBConnection, DuckDBScalarFunction, DuckDBType
} from '@duckdb/node-api';
import { resolve } from 'node:path';
import { quoteLiteral } from '@terascope/sql-builder';
import { createScalarFunction, ScalarFunctionSpec } from './scalar-function.js';
import { toPlainValue } from './plain-values.js';
import { ValueShaper } from './row-shape.js';
import { DuckDatabaseSettings } from './interfaces.js';
import { extensionSettingsFromEnv, ExtensionSettings, loadExtensions } from './extensions.js';

/** DuckDB's hard per-chunk row limit. Appending more in one chunk throws. */
export const MAX_CHUNK_ROWS = 2048;

/**
 * Owns a DuckDB instance and its shared connection.
 *
 * Internal: it is not exported from the package, and callers reach the database through
 * `configureDuckDatabase`, `registerScalarFunction` and `closeDuckDatabase`. Processes that
 * need to exchange data hand each other Parquet files rather than sharing a database.
 *
 * Every frame on a database shares the instance, because tables live in its catalog and any
 * connection can see them (they are real tables, not TEMP tables, which would be
 * connection-local). Streams do not share the connection; see `streamRowObjects`.
*/
export class DuckContext {
    /**
     * Registered scalar functions, kept so they are not garbage-collected while DuckDB still
     * holds them, and so a name cannot be silently registered twice.
    */
    private readonly functions = new Map<string, DuckDBScalarFunction>();

    private constructor(
        readonly instance: DuckDBInstance,
        readonly connection: DuckDBConnection,
        /** The database path, so a frame can report where it lives. */
        readonly path: string,
        /** Fixed for the instance's life - DuckDB resolves extensions from it at LOAD. */
        readonly extensionDirectory: string | undefined
    ) {}

    /**
     * Registers a scalar function on the instance.
     *
     * Registration is instance-wide: a function registered on one connection is visible to
     * every other connection, including the private connection each stream opens. That is
     * what lets UDFs and streaming work together.
    */
    registerFunction(spec: ScalarFunctionSpec): void {
        // Idempotent: `tealFrameAdapter` derives the name from (function, column, args), so
        // a second registration under the same name is the same function and must not error.
        if (this.functions.has(spec.name)) return;

        const fn = createScalarFunction(spec);
        this.connection.registerScalarFunction(fn);
        this.functions.set(spec.name, fn);
    }

    /** How many scalar functions are registered. They cannot be removed, so keep this bounded. */
    get functionCount(): number {
        return this.functions.size;
    }

    hasFunction(name: string): boolean {
        return this.functions.has(name);
    }

    /**
     * Opens the database and loads the required extensions, so a missing extension fails at
     * startup rather than at the first query that needs it (see `extensions.ts`).
     *
     * Explicit settings take precedence over the environment. On failure the instance is
     * closed, because nothing else holds it and it would otherwise leak.
    */
    static async create(
        path = ':memory:',
        settings: DuckDatabaseSettings = {}
    ): Promise<DuckContext> {
        const extensions = resolveExtensionSettings(settings);
        const instance = await DuckDBInstance.create(path, instanceOptions(extensions));

        let connection: DuckDBConnection | undefined;
        try {
            connection = await instance.connect();
            const context = new DuckContext(
                instance, connection, path, extensions.extensionDirectory
            );
            await context.applySettings(settings);
            await loadExtensions(connection, extensions.autoinstallExtensions ?? true);
            return context;
        } catch (err) {
            // Close both, as `disconnect()` does: a live connection keeps a closed instance open
            connection?.disconnectSync();
            instance.closeSync();
            throw err;
        }
    }

    /**
     * Applies the spill, memory and thread settings. They are runtime `SET`s, so they can be
     * changed on an open database.
     *
     * Without `temp_directory`, a query that exceeds `memory_limit` fails instead of spilling
     * to disk.
     *
     * **Set `memory_limit` below the container's memory cap.** If DuckDB thinks it has more
     * memory than the container allows, it never spills and the kernel kills the process.
    */
    async applySettings(settings: DuckDatabaseSettings): Promise<void> {
        // Refused rather than applied: extensions already loaded from the old directory stay
        // loaded, so the new value would be reported but never used. Paths are compared after
        // resolving, so `/ext/` and `/ext` count as the same directory.
        if (settings.extensionDirectory != null
            && !sameDirectory(settings.extensionDirectory, this.extensionDirectory)) {
            throw new Error(
                `extensionDirectory is fixed once the database opens - "${this.path}" opened`
                + ` with ${this.extensionDirectory ?? 'the default'}, so`
                + ` "${settings.extensionDirectory}" cannot take effect. Set`
                + ` DUCKDB_EXTENSION_DIRECTORY, or configure before the first frame.`
            );
        }
        if (settings.autoinstallExtensions != null) {
            await this.run(`SET autoinstall_known_extensions = ${settings.autoinstallExtensions}`);
        }
        if (settings.tempDirectory != null) {
            await this.run(`SET temp_directory = ${quoteLiteral(settings.tempDirectory)}`);
        }
        if (settings.maxTempDirectorySize != null) {
            await this.run(
                `SET max_temp_directory_size = ${quoteLiteral(settings.maxTempDirectorySize)}`
            );
        }
        if (settings.memoryLimit != null) {
            await this.run(`SET memory_limit = ${quoteLiteral(settings.memoryLimit)}`);
        }
        if (settings.threads != null) {
            await this.run(`SET threads = ${Math.trunc(settings.threads)}`);
        }
    }

    async run(sql: string): Promise<void> {
        await this.connection.run(sql);
    }

    async scalar(sql: string): Promise<unknown> {
        const rows = await (await this.connection.run(sql)).getRowsJson();
        return rows.length === 0 ? undefined : rows[0][0];
    }

    async rows(sql: string): Promise<unknown[][]> {
        return (await (await this.connection.run(sql)).getRowsJson()) as unknown[][];
    }

    /**
     * The columns a query produces, with their DuckDB type objects. No rows are read.
     *
     * Type objects rather than `DESCRIBE`'s text, because that text does not quote struct member
     * names: in `STRUCT(HUGEINT BIGINT)` the member is named `HUGEINT`, and string matching
     * cannot tell a name from a type.
    */
    async columnTypes(sql: string): Promise<{ name: string; type: DuckDBType }[]> {
        const result = await this.connection.run(`SELECT * FROM (${sql}) LIMIT 0`);
        const types = result.columnTypes();
        return result.columnNames().map((name, i) => ({ name, type: types[i] }));
    }

    /**
     * Streams a single-column result as strings, chunk by chunk.
     *
     * For output DuckDB has already rendered, such as ldjson lines, where the only work left in
     * JS is moving bytes. It skips `toPlainValue` because each value is already the final text.
     * Like `streamRowObjects`, it uses its own connection.
    */
    async* streamColumnStrings(sql: string): AsyncIterableIterator<string> {
        const connection = await this.instance.connect();

        try {
            const result = await connection.stream(sql);

            for (;;) {
                const chunk = await result.fetchChunk();
                if (chunk == null || chunk.rowCount === 0) return;

                const values = chunk.getColumnValues(0);
                for (let row = 0; row < chunk.rowCount; row++) {
                    yield String(values[row]);
                }
            }
        } finally {
            connection.disconnectSync();
        }
    }

    /**
     * Streams a query's rows as objects, one DuckDB chunk at a time, so a large result is never
     * held in JS all at once.
     *
     * **Each stream opens its own connection and closes it when the stream ends.** Running any
     * other query on a connection that holds an open streaming result silently truncates that
     * stream, with no error. On a shared connection, any frame's `size()` could cut a stream
     * short.
     *
     * `shapers` finish a column's value where the value alone is not enough; for example, a
     * `Tuple` is stored as a STRUCT but must come out as an array. See `row-shape.ts`.
    */
    async* streamRowObjects(
        sql: string,
        shapers: ReadonlyMap<string, ValueShaper> = new Map()
    ): AsyncIterableIterator<Record<string, unknown>> {
        const connection = await this.instance.connect();

        try {
            const result = await connection.stream(sql);
            const names = result.columnNames();

            for (;;) {
                const chunk = await result.fetchChunk();
                // At the end of the result `fetchChunk` returns an empty chunk, repeatedly,
                // rather than null. An empty chunk is the end; waiting for null would loop
                // forever. The null check is only a guard.
                if (chunk == null || chunk.rowCount === 0) return;

                const columns = names.map((_name, i) => chunk.getColumnValues(i));
                const shape = names.map((name) => shapers.get(name));
                for (let row = 0; row < chunk.rowCount; row++) {
                    yield Object.fromEntries(names.map((name, col) => {
                        const value = toPlainValue(columns[col][row]);
                        return [name, shape[col] ? shape[col](value) : value];
                    }));
                }
            }
        } finally {
            // also runs on an early `break` out of a `for await`, not only on exhaustion
            connection.disconnectSync();
        }
    }

    /**
     * Closes the connection and the instance.
     *
     * Closing the instance is required once a scalar UDF has been registered: a process that
     * registered one does not exit after `disconnectSync()` alone, and
     * `DuckDBScalarFunction.destroySync()` does not help. `instance.closeSync()` releases it.
    */
    disconnect(): void {
        this.connection.disconnectSync();
        this.instance.closeSync();
    }
}

function resolveExtensionSettings(settings: DuckDatabaseSettings): ExtensionSettings {
    const env = extensionSettingsFromEnv();
    return {
        extensionDirectory: settings.extensionDirectory ?? env.extensionDirectory,
        autoinstallExtensions: settings.autoinstallExtensions ?? env.autoinstallExtensions,
    };
}

/** Set at open, not by a later `SET`, so nothing can load from the wrong place first. */
function instanceOptions(extensions: ExtensionSettings): Record<string, string> {
    return {
        ...(extensions.extensionDirectory != null && {
            extension_directory: extensions.extensionDirectory,
        }),
        ...(extensions.autoinstallExtensions != null && {
            autoinstall_known_extensions: String(extensions.autoinstallExtensions),
        }),
    };
}

function sameDirectory(a: string, b: string | undefined): boolean {
    return b != null && resolve(a) === resolve(b);
}
