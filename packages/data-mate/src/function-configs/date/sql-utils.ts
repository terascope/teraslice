import { getValidDateWithTimezone } from '@terascope/core-utils';

/**
 * Helpers shared by the `sql` emissions on the date function configs.
 *
 * The stored value is a **naive UTC `TIMESTAMP`** - established by the first date batch, and
 * verified under `TZ=America/New_York`: `getHours('2026-01-02T03:04:05.678Z')` is `3`, the UTC
 * hour. So none of this does timezone handling, and none of it should start.
 *
 * **Why every setter narrows `applies` to the argument's VALID RANGE.** These functions validate in
 * `create()` and THROW - `setHours(25)` is `hours value must be an integer between 0 and 23`. A
 * pure SQL emission never calls `create()`, so a bare `Number.isInteger` guard would let `25`
 * through and quietly return the next day at 01:00 where the UDF path raises. The range in each
 * `applies` is the range that function's own error message names.
*/

/**
 * A `TIMESTAMP` literal for an argument that is a date, resolved at PLAN time.
 *
 * The argument may be a string, a number of epoch millis, a `Date` or a `DateTuple`, and the UDF
 * puts every one of them through `getValidDateWithTimezone` - so the emission calls the same
 * converter rather than reimplementing the accepted forms. `validate_arguments` has already
 * rejected anything invalid by the time this runs; the `false` branch is there because the
 * converter's type says it can, not because it is reachable.
*/
export function timestampLiteral(value: unknown): string | null {
    const date = getValidDateWithTimezone(value, false);
    if (!date) return null;
    return `TIMESTAMP '${date.toISOString().slice(0, 23)
        .replace('T', ' ')}'`;
}

/** True when the argument resolves to a date, so the emission can be built for it. */
export function isDateArg(value: unknown): boolean {
    return timestampLiteral(value) != null;
}

/**
 * Replaces ONE field of a timestamp, keeping everything finer than it and **rolling over** the way
 * JavaScript does.
 *
 * `setUTCDate(31)` on a February date is March 3 in JavaScript, not an error and not February 28 -
 * `Date` overflows into the next month. DuckDB's `+ INTERVAL n MONTH` CLAMPS instead (Jan 31 plus a
 * month is Feb 28), so an emission built by adding to the original timestamp would silently
 * disagree on exactly the inputs that matter.
 *
 * Rebuilding from the PARENT boundary avoids that: truncating to the start of the enclosing unit
 * makes the day-of-month 1, where no clamping can happen, and the offsets added after it are plain
 * day and time arithmetic that overflows naturally. Feb 1 + 30 days is March 3 in both languages.
 *
 * @param parent the unit that ENCLOSES the field being set - `'month'` for a day-of-month
 * @param unit the field being set
 * @param offset how far past the parent boundary the new value sits, already SQL
*/
export function replaceField(
    value: string,
    parent: string,
    unit: string,
    offset: string
): string {
    return `(date_trunc('${parent}', ${value}) + INTERVAL (${offset}) ${unit}`
        + ` + (${value} - date_trunc('${unit}', ${value})))`;
}
