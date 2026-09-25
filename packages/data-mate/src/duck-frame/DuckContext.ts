import {
    DuckDBInstance, DuckDBConnection, DuckDBScalarFunction
} from '@duckdb/node-api';
import { resolve } from 'node:path';
import { quoteLiteral } from '@terascope/sql-builder';
import { createScalarFunction, ScalarFunctionSpec } from './scalar-function.js';
import { toPlainValue } from './plain-values.js';
import { DuckDatabaseSettings } from './interfaces.js';
import { extensionSettingsFromEnv, ExtensionSettings, loadExtensions } from './extensions.js';

/** DuckDB's hard per-chunk row limit. Appending more in one chunk throws. */
export const MAX_CHUNK_ROWS = 2048;

/**
 * Owns the DuckDB instance and the shared connection.
 *
 * INTERNAL. Not in the package barrel and not reachable from a frame: there is exactly ONE
 * database per
 * process - the qpl-api and qpl-worker are separate processes whose frames never meet, and a
 * child hands Parquet to its parent rather than sharing a catalogue. A caller has nothing to
 * pass around, so it is not in the API.
 *
 * The *instance* is shared because tables live in its catalogue and any connection can see
 * them (they are real tables, not TEMP, which would be connection-local). The *connection*
 * is deliberately NOT shared with streams - see `streamRowObjects`.
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
     * Registers a scalar function. **Instance-wide, not connection-scoped** - MEASURED: a
     * function registered on one connection is visible to every other connection on the same
     * instance, including the private connection each `rows()` stream opens. That is what
     * makes UDFs and streaming compatible.
    */
    registerFunction(spec: ScalarFunctionSpec): void {
        // Idempotent: `duckFrameAdapter` derives the name from (function, column, args), so
        // the same step registered twice IS the same function and must not error.
        if (this.functions.has(spec.name)) return;

        const fn = createScalarFunction(spec);
        this.connection.registerScalarFunction(fn);
        this.functions.set(spec.name, fn);
    }

    hasFunction(name: string): boolean {
        return this.functions.has(name);
    }

    /**
     * Opens the database and LOADs the required extensions, so a missing one fails HERE, at
     * startup, instead of at the first query that needs it (see `extensions.ts`).
     *
     * Explicit settings win over the environment. On any failure the instance is closed -
     * nothing else holds it, so it would otherwise leak.
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
            // Both, as in `disconnect()`: a live connection keeps a closed instance usable
            connection?.disconnectSync();
            instance.closeSync();
            throw err;
        }
    }

    /**
     * Applies the spill and memory settings.
     *
     * `temp_directory` is what makes "load the whole dataset and let DuckDB overflow to disk"
     * work - without it a query that exceeds `memory_limit` fails instead of spilling. Both
     * are runtime `SET`s, so they can be changed on an existing database.
     *
     * `memory_limit` MUST be set below the container's cap. If DuckDB believes it has more
     * than the container allows it never spills and the kernel kills the process - that is
     * exactly what produced the bogus "OOMs and does not spill" finding in docs/HANDOFF.md.
    */
    async applySettings(settings: DuckDatabaseSettings): Promise<void> {
        // Refused rather than applied: extensions already loaded from the old directory stay
        // loaded, so the new value would be reported and never used.
        // Compared resolved: DuckDB keeps the string verbatim, so `/ext/` and `/ext` would
        // otherwise be refused as different directories.
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
     * Streams a query's rows as objects, a DuckDB chunk at a time.
     *
     * Uses `stream()` + `fetchChunk()` rather than a materializing read, so a large
     * result never lands in JS all at once. The QPL engine's output path is
     * `frame.rows(...)` returning an `Iterable`, not an array (`run.ts:188`), so streaming
     * is the shape that path already expects.
     *
     * **Each stream gets its OWN connection and closes it when the stream ends.**
     * MEASURED (`docs/tools/conn-isolation.mjs`): any query run on a connection holding an
     * open streaming result silently truncates that stream - one interleaved query took
     * 500,000 rows down to 100,352, with NO error. DuckDB concurrency itself is fine; the
     * limit is per-connection. On the shared connection, any other frame's `size()` - or
     * this frame's own - could clip a stream in progress and look like a short result.
    */
    /**
     * Streams a single-column result as strings, chunk by chunk.
     *
     * For output formats DuckDB has already rendered - ldjson, CSV - where the only work left
     * in JS is moving bytes. Deliberately does NOT go through `toPlainValue`: the value is
     * already the final text.
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

    async* streamRowObjects(sql: string): AsyncIterableIterator<Record<string, unknown>> {
        const connection = await this.instance.connect();

        try {
            const result = await connection.stream(sql);
            const names = result.columnNames();

            for (;;) {
                const chunk = await result.fetchChunk();
                // MEASURED: fetchChunk never returns null - at the end it returns an EMPTY
                // chunk, forever. So rowCount === 0 IS the terminator. Skipping empties and
                // waiting for null (which is what the docs' shape suggests) is an infinite
                // loop; the null check stays only as a guard, not as the exit condition.
                if (chunk == null || chunk.rowCount === 0) return;

                const columns = names.map((_name, i) => chunk.getColumnValues(i));
                for (let row = 0; row < chunk.rowCount; row++) {
                    yield Object.fromEntries(
                        names.map((name, col) => [name, toPlainValue(columns[col][row])])
                    );
                }
            }
        } finally {
            // also runs on an early `break` out of a `for await`, not just on exhaustion
            connection.disconnectSync();
        }
    }

    /**
     * Closes the connection AND the instance.
     *
     * Closing the instance is not optional once a scalar UDF has been registered: MEASURED
     * (isolated in an earlier session; that script is gone), a process that registers one
     * **never exits** on
     * `disconnectSync()` alone, and `DuckDBScalarFunction.destroySync()` makes no difference.
     * `instance.closeSync()` is what releases it. Without a UDF the process exits either way,
     * so this is only visible once UDFs land - which is exactly when it would be hardest to
     * diagnose.
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
