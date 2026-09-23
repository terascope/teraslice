import { DuckContext } from './DuckContext.js';
import { ScalarFunctionSpec } from './scalar-function.js';
import { DuckDatabaseOptions } from './interfaces.js';

const contexts = new Map<string, Promise<DuckContext>>();

/**
 * The context for a database path, created on first use and cached per path.
 *
 * `:memory:` is the process-wide default. A distinct path gives a file-backed database, and
 * is also how a test gets an isolated catalogue.
*/
export function getContext(database = ':memory:'): Promise<DuckContext> {
    let context = contexts.get(database);
    if (!context) {
        context = DuckContext.create(database);
        contexts.set(database, context);
    }
    return context;
}

/**
 * Opens or reconfigures a database, and returns once the settings are applied.
 *
 * Call once at startup to point spill at a real directory:
 * `configureDuckDatabase({ tempDirectory: '/var/tmp/duck', memoryLimit: '48GB' })`.
 * Settings are runtime `SET`s, so calling it on an already-open database updates it.
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

    const created = DuckContext.create(database ?? ':memory:', settings);
    contexts.set(database ?? ':memory:', created);
    await created;
}

/**
 * Registers a scalar function so SQL can call a real data-mate primitive.
 *
 * This is the ONLY way to run the 205 QPL functions inside a query: they are JavaScript, and
 * reimplementing their semantics in SQL is what produced 11 divergences last time (DuckDB's
 * own casts differ from the DataType config on 26 of 40 probed inputs). A UDF over the real
 * primitive is parity by construction, the same argument that makes `fromRecords` use
 * `coerceToType`.
 *
 * Registration is instance-wide, so the function is available to every frame and every
 * stream on that database.
*/
export async function registerScalarFunction(
    spec: ScalarFunctionSpec & { database?: string }
): Promise<string> {
    const { database, ...fnSpec } = spec;
    (await getContext(database)).registerFunction(fnSpec);
    return fnSpec.name;
}

/**
 * Closes a cached database and forgets it. For test teardown; a process that simply exits
 * does not need to call it.
*/
export async function closeDuckDatabase(database = ':memory:'): Promise<void> {
    const context = contexts.get(database);
    if (!context) return;
    contexts.delete(database);
    (await context).disconnect();
}
