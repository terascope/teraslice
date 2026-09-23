import { AppendFailure, CoercionFailure } from './interfaces.js';

/**
 * What the DuckDB frame throws.
 *
 * Both carry the context a caller needs to decide what to do next, which is why they are
 * classes rather than bare `Error`s: a coercion failure names every field that failed and an
 * example value, and an append failure says what SURVIVED in the table it was rolled back
 * from.
*/

/** Raised by strict mode when a value does not fit its declared field type. */
export class CoercionFailureError extends Error {
    constructor(message: string, readonly failures: readonly CoercionFailure[]) {
        super(message);
        this.name = 'CoercionFailureError';
    }
}

/**
 * An `append` that did not happen.
 *
 * The whole point is to say **what survived**: an append runs in a transaction, so a failure
 * leaves the table exactly as it was, and a worker assembling one table from many payloads
 * needs to know that its earlier payloads are intact. The underlying error is kept as `cause`.
 *
 * `fromRecords` deliberately does NOT wrap in this - it is one-shot, so there is no prior table
 * to reassure anyone about, and its contract is to throw what `DataFrame` throws.
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
