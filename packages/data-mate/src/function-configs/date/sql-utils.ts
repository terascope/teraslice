import { getValidDateWithTimezone } from '@terascope/core-utils';
import { sqlLiteral } from '../sql-helpers.js';

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

/**
 * The units of `addToDate`/`subtractFromDate` that SQL can reproduce, and why the rest cannot.
 *
 * **`date-fns` `add`/`sub` operate on LOCAL WALL-CLOCK time**, while the stored column is naive
 * UTC. Measured: under `TZ=America/New_York`, `addToDate('1900-03-01T00:00:00Z', { months: 1 })` is
 * `1900-03-29`, not `1900-04-01` - midnight UTC is the PREVIOUS DAY locally, so the month is added
 * to February. Under `TZ=UTC` and `TZ=Asia/Kolkata` every case in the probe matched. Day and week
 * units break the same way across a DST transition: `+ { days: 1 }` over 2026-03-08 adds 23 hours,
 * where `INTERVAL 1 DAY` on a naive timestamp adds 24.
 *
 * So the calendar units are process-timezone dependent and are left on the UDF - the answer is not
 * one SQL could reproduce without knowing the server's zone, and reproducing a timezone-dependent
 * answer is not obviously the right goal anyway (see `docs/known-defects.md` DF6).
 *
 * Hours, minutes and seconds are exact epoch arithmetic on both sides and always agree.
 * **`milliseconds` is silently IGNORED** by both, because `date-fns`' `Duration` has no such key -
 * verified, `add(d, { milliseconds: 500 })` returns `d` unchanged.
*/
const TIME_UNITS: Record<string, string> = {
    hours: 'HOUR', minutes: 'MINUTE', seconds: 'SECOND',
};

const CALENDAR_UNITS = ['years', 'months', 'weeks', 'days'];

/** True when the arguments use only units SQL reproduces exactly. See `TIME_UNITS`. */
export function isTimeOnlyAdjustment(args: Record<string, any>): boolean {
    if ('expr' in args && args.expr != null) return false;
    return CALENDAR_UNITS.every((unit) => !args[unit]);
}

/**
 * The adjustment as a SQL interval, or null when there is nothing to add.
 *
 * A null means the value passes through unchanged, which is what an empty duration - or one made up
 * only of the ignored `milliseconds` - does in JavaScript.
*/
export function timeInterval(args: Record<string, any>): string | null {
    const parts = Object.entries(TIME_UNITS)
        .filter(([name]) => Number(args[name]))
        .map(([name, unit]) => `INTERVAL (${Number(args[name])}) ${unit}`);
    return parts.length ? parts.join(' + ') : null;
}

/**
 * The `getTimeBetween` intervals SQL reproduces, as seconds-per-unit.
 *
 * **These are TRUNCATED differences, not boundary counts.** `date_diff('hour', ...)` counts hour
 * boundaries crossed, where `differenceInHours` truncates the elapsed time - `00:59` to `01:00` is
 * one boundary and zero full hours. So the emission divides an elapsed-seconds value and truncates,
 * which is what `date-fns` does.
 *
 * Only the epoch-based intervals are here. The `calendar*` variants, `months`, `quarters`, `years`,
 * `businessDays`, the ISO-week family and the `ISO8601` duration string are all calendar
 * arithmetic
 * on LOCAL wall-clock time - the same timezone dependency that limits `addToDate` - and stay
 * on the UDF. Verified: these six agree under `TZ=UTC` and `TZ=America/New_York` alike, because
 * `differenceInDays` and `differenceInWeeks` are epoch-based despite their names.
*/
const INTERVAL_SECONDS: Record<string, number> = {
    seconds: 1, minutes: 60, hours: 3600, days: 86400, weeks: 604800,
};

/** True when `getTimeBetween` can be emitted for these arguments. */
interface TimeBetweenArgs {
    interval?: unknown;
    start?: unknown;
    end?: unknown;
}

export function isEpochInterval(args: TimeBetweenArgs): boolean {
    const interval = args.interval as string;
    const known = interval === 'milliseconds' || INTERVAL_SECONDS[interval] != null;
    // exactly one end is given - `validate_arguments` has already enforced that
    return known && (args.start != null || args.end != null);
}

/**
 * The elapsed time between the column and the fixed end, truncated to the interval.
 *
 * The sign follows `_getStartEndTime`: a `start` makes the column the LATER value, an `end` makes
 * it the earlier one.
*/
export function timeBetween(value: string, args: TimeBetweenArgs): string {
    const fixed = timestampLiteral(args.start ?? args.end);
    const elapsed = args.start != null
        ? `epoch(${value} - ${fixed})`
        : `epoch(${fixed} - ${value})`;
    const interval = args.interval as string;
    const scaled = interval === 'milliseconds'
        ? `${elapsed} * 1000`
        : `${elapsed} / ${INTERVAL_SECONDS[interval]}`;
    return `CAST(trunc(${scaled}) AS BIGINT)`;
}

/**
 * The offset of `zone` from UTC, in minutes, AT the instant in `value`.
 *
 * There is no one-call offset function - `date_part('timezone', ts)` only answers for the SESSION
 * zone - but this idiom is per-row and DST-aware, and it is the one the coverage research found.
 * Verified against `getTimezoneOffset` over six zones and six instants, including both US DST
 * transitions and the half-hour zones: 36 of 36.
 *
 * The argument ORDER is the whole thing. Reversed, every non-UTC zone comes back with the wrong
 * sign - `America/New_York` in January is `-300`, not `300` - and UTC still matches, so a battery
 * without a real zone in it would not notice.
*/
export function timezoneOffsetMinutes(value: string, zone: string): string {
    const local = `(${value} AT TIME ZONE ${sqlLiteral(zone)}) AT TIME ZONE 'UTC'`;
    return `CAST(date_diff('second', ${local}, ${value}) / 60 AS BIGINT)`;
}
