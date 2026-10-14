import { DuckContext } from './DuckContext.js';
import { ScalarFunctionSpec } from './scalar-function.js';
import { DuckDatabaseOptions, DuckDatabaseSettings } from './interfaces.js';

const contexts = new Map<string, Promise<DuckContext>>();

/**
 * Returns the context for a database path, creating it on first use and caching it per path.
 *
 * `:memory:` is the process-wide default. Any other path is a file-backed database, which is
 * also how a test gets an isolated catalog.
*/
export function getContext(database = ':memory:'): Promise<DuckContext> {
    return contexts.get(database) ?? openContext(database);
}

/**
 * Opens and caches a context, and removes it from the cache if opening fails.
 *
 * Otherwise a failed open would stay cached, and every later call for that database would
 * rethrow the same error for the life of the process. A failure such as a missing extension
 * must be retryable once its cause is fixed.
*/
function openContext(
    database: string,
    settings: DuckDatabaseSettings = {}
): Promise<DuckContext> {
    const created = DuckContext.create(database, settings);
    contexts.set(database, created);

    // This only handles a branch; every caller awaiting `created` still receives the rejection.
    created.catch(() => {
        if (contexts.get(database) === created) contexts.delete(database);
    });
    return created;
}

/**
 * Opens or reconfigures a database, and resolves once the settings are applied.
 *
 * Call it once at startup, for example to give DuckDB a directory to spill to:
 * `configureDuckDatabase({ tempDirectory: '/var/tmp/duck', memoryLimit: '48GB' })`.
 * Calling it on a database that is already open updates the settings in place.
*/
export async function configureDuckDatabase(
    options: DuckDatabaseOptions = {}
): Promise<void> {
    const { database, ...settings } = options;
    const existing = contexts.get(database ?? ':memory:');

    if (existing) {
        await (await existing).applySettings(settings);
        return;
    }

    await openContext(database ?? ':memory:', settings);
}

/**
 * Registers a scalar function (UDF) so SQL can call a data-mate function's JavaScript
 * implementation.
 *
 * This is how a data-mate function without a native SQL translation runs inside a query.
 * Calling the JavaScript implementation guarantees the same results as `DataFrame`, whereas
 * DuckDB's own casts and functions often differ from it on edge cases.
 *
 * Registration is instance-wide, so the function is available to every frame and every
 * stream on that database. Returns the function's name.
*/
export async function registerScalarFunction(
    spec: ScalarFunctionSpec & { database?: string }
): Promise<string> {
    const { database, ...fnSpec } = spec;
    (await getContext(database)).registerFunction(fnSpec);
    return fnSpec.name;
}

/**
 * The number of scalar functions registered on a database.
 *
 * DuckDB cannot unregister a function, so this grows with the functions and data types in use
 * (never with their arguments; see `scalar-function.ts`). A long-running process may want to
 * report it as a metric.
*/
export async function registeredFunctionCount(database?: string): Promise<number> {
    return (await getContext(database)).functionCount;
}

/**
 * Closes a cached database and removes it from the cache. Intended for test teardown; a
 * process that is exiting does not need to call it.
*/
export async function closeDuckDatabase(database = ':memory:'): Promise<void> {
    const context = contexts.get(database);
    if (!context) return;
    contexts.delete(database);

    let opened: DuckContext;
    try {
        opened = await context;
    } catch {
        // The open failed: its error went to the caller that opened it, and `create` already
        // closed the instance, so there is nothing left to close.
        return;
    }
    opened.disconnect();
}
