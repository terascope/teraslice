import { AppendFailure, CoercionFailure, ExtensionFailure } from './interfaces.js';

/**
 * Errors thrown by the DuckDB frame.
 *
 * They are classes rather than plain `Error`s so they can carry context: a coercion failure
 * lists each failing field with an example value, and an append failure reports what is left
 * in the table after the rollback.
*/

/** Raised by strict mode when a value does not fit its declared field type. */
export class CoercionFailureError extends Error {
    constructor(message: string, readonly failures: readonly CoercionFailure[]) {
        super(message);
        this.name = 'CoercionFailureError';
    }
}

/**
 * Thrown when an `append` fails and is rolled back.
 *
 * An append runs in a transaction, so a failure leaves the table as it was. The message says
 * how many rows remain, so a caller building one table from many payloads knows its earlier
 * payloads are intact. The underlying error is kept as `cause`.
 *
 * `fromRecords` does not use this error: it has no earlier table to report on, and it throws
 * what `DataFrame` throws.
*/
export class AppendError extends Error {
    constructor(readonly failure: AppendFailure, cause: unknown) {
        const reason = cause instanceof Error ? cause.message : String(cause);
        const survived = failure.rowsRemaining == null
            ? 'the table could not be counted afterwards, so its contents are in doubt'
            : `the table is unchanged and still has ${failure.rowsRemaining} row(s)`;

        super(
            `appending ${failure.describedSource} to table "${failure.table}" failed`
            + ` - it was rolled back, so ${survived}. Cause: ${reason}`,
            { cause }
        );
        this.name = 'AppendError';
    }
}

/**
 * Thrown when required DuckDB extensions cannot be loaded as the database opens.
 *
 * Failing at startup gives a clear message. Otherwise the first query that needs the
 * extension fails with a DuckDB autoload error that does not explain how to fix it.
*/
export class DuckExtensionError extends Error {
    constructor(readonly failure: ExtensionFailure) {
        const names = failure.missing.map(({ name }) => name).join(', ');
        const details = failure.missing
            .map(({ name, reason, error }) => `  ${name} (${reason}): ${error}`)
            .join('\n');
        const fix = failure.autoinstall
            ? 'the download failed, so this machine cannot reach the extension repository'
            : 'autoinstall is off, so they must be installed when the image is built:'
                + ` \`duckdb-extensions install --dir ${failure.directory}\``;

        super(
            `DuckDB extension(s) ${names} could not be loaded (duckdb ${failure.version},`
            + ` ${failure.platform}, directory ${failure.directory}) - ${fix}\n${details}`
        );
        this.name = 'DuckExtensionError';
    }
}
