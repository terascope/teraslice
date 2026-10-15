import { getValidDateWithTimezone, isNumber, timezoneToOffset } from '@terascope/core-utils';
import { sqlLiteral } from '../sql-helpers.js';

/**
 * Helpers shared by the SQL expressions on the date function configs.
 *
 * A `Date` column is stored as a naive UTC `TIMESTAMP`, so these helpers do no timezone handling.
 *
 * Every setter limits `applies` to the argument's valid range. The functions validate in
 * `create()` and throw (`setHours(25)` fails with `hours value must be an integer between 0 and
 * 23`), but a SQL expression never calls `create()`, so `25` would quietly roll over to 01:00
 * the next day. Out-of-range arguments use the UDF instead, which throws.
*/

/**
 * A `TIMESTAMP` literal for a date argument, resolved when the query is planned.
 *
 * It uses the UDF's own converter, `getValidDateWithTimezone`, so it accepts the same forms: a
 * string, epoch millis, a `Date` or a `DateTuple`. `validate_arguments` has already rejected
 * invalid input; the null return exists only because the converter's type allows it.
*/
export function timestampLiteral(value: unknown): string | null {
    const date = getValidDateWithTimezone(value, false);
    if (!date) return null;
    return `TIMESTAMP '${date.toISOString().slice(0, 23)
        .replace('T', ' ')}'`;
}

/** True when the argument resolves to a date, so a SQL expression can be built for it. */
export function isDateArg(value: unknown): boolean {
    return timestampLiteral(value) != null;
}

/**
 * Replaces one field of a timestamp, keeping the finer fields and rolling over the way
 * JavaScript does.
 *
 * In JavaScript, `setUTCDate(31)` on a February date gives March 3. DuckDB's
 * `+ INTERVAL n MONTH` clamps instead (Jan 31 plus a month is Feb 28), so adding to the original
 * timestamp would give a different answer. Starting from the enclosing unit's boundary avoids
 * the clamp: the day-of-month is then 1, and the offsets added after it are plain day and time
 * arithmetic that overflows the same way in both. Feb 1 + 30 days is March 3 in both.
 *
 * @param parent the unit that encloses the field being set, e.g. `'month'` for a day-of-month
 * @param unit the field being set
 * @param offset how far past the parent boundary the new value sits, as SQL
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
 * The `addToDate`/`subtractFromDate` units that SQL reproduces exactly.
 *
 * `date-fns`' `add` and `sub` work on local wall-clock time, while the column is naive UTC. Under
 * `TZ=America/New_York`, `addToDate('1900-03-01T00:00:00Z', { months: 1 })` is `1900-03-29`,
 * because midnight UTC is still February locally; under `TZ=UTC` it is `1900-04-01`. Days and
 * weeks differ the same way across DST: `{ days: 1 }` over 2026-03-08 adds 23 hours, while
 * `INTERVAL 1 DAY` adds 24. So years, months, weeks and days depend on the host timezone and
 * keep the UDF.
 *
 * Hours, minutes and seconds are exact epoch arithmetic on both sides. `milliseconds` is ignored
 * by both, because `date-fns`' `Duration` has no such key.
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
 * The `getTimeBetween` intervals SQL reproduces, as seconds per unit.
 *
 * The result is the elapsed time divided by the unit and truncated, as `date-fns` does.
 * `date_diff('hour', ...)` would count hour boundaries crossed instead: `00:59` to `01:00`
 * crosses one boundary but is zero full hours.
 *
 * The `calendar*` variants, `months`, `quarters`, `years`, `businessDays`, the ISO-week family
 * and the `ISO8601` duration string work on local wall-clock time, like `addToDate`'s calendar
 * units, and keep the UDF.
 *
 * `days` and `weeks` match only when the host timezone has no DST change between the two
 * dates: `differenceInDays` counts local days, so 23 hours across a spring-forward change is
 * 1 day there and 0 here.
*/
const INTERVAL_SECONDS: Record<string, number> = {
    seconds: 1, minutes: 60, hours: 3600, days: 86400, weeks: 604800,
};

interface TimeBetweenArgs {
    interval?: unknown;
    start?: unknown;
    end?: unknown;
}

/** True when `getTimeBetween` can run as SQL for these arguments. */
export function isEpochInterval(args: TimeBetweenArgs): boolean {
    const interval = args.interval as string;
    const known = interval === 'milliseconds' || INTERVAL_SECONDS[interval] != null;
    // exactly one end is given - `validate_arguments` has already enforced that
    return known && (args.start != null || args.end != null);
}

/**
 * The elapsed time between the column and the fixed end, truncated to the interval.
 *
 * The sign follows `_getStartEndTime`: with `start` the column is the later value, with `end`
 * it is the earlier one.
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
 * A date value with a display offset, `{ ms, tz_offset }`: how TealFrame stores a `DateTuple`
 * (`[ms, offset]`, see `teal-frame/date-value.ts`). The member names are written out here
 * because function configs do not depend on TealFrame. `instant` is a TIMESTAMP; NULL gives NULL.
*/
export function dateWithOffset(instant: string, offsetMinutes: string): string {
    return `CASE WHEN ${instant} IS NULL THEN NULL ELSE`
        + ` {'ms': epoch_ms(${instant}), 'tz_offset': CAST(${offsetMinutes} AS SMALLINT)} END`;
}

/**
 * A timezone's current offset in minutes, resolved in JavaScript with `timezoneToOffset` as
 * `setTimezone` does. Returns undefined when core-utils cannot resolve the zone, so the UDF runs
 * and fails or returns null as it does in `DataFrame`.
*/
export function currentOffsetMinutes(timezone: unknown): number | undefined {
    try {
        const offset = isNumber(timezone) ? timezone : timezoneToOffset(timezone);
        return Number.isInteger(offset) && Math.abs(offset) < 24 * 60 ? offset : undefined;
    } catch {
        return undefined;
    }
}

/**
 * The offset of `zone` from UTC in minutes, per row, as `toTimeZone` attaches it.
 *
 * It is the zone's offset at the local wall time equal to the UTC instant, not at the instant
 * itself, because that is what core-utils' `getTimezoneOffset` returns. The two differ only
 * within a few hours of a DST change. The result does not depend on the host timezone.
 *
 * The order of the two `AT TIME ZONE` steps matters: reversed, every non-UTC zone gets the wrong
 * sign (`America/New_York` in January would be `300` instead of `-300`).
*/
export function timezoneOffsetMinutes(value: string, zone: string): string {
    const local = `(${value} AT TIME ZONE ${sqlLiteral(zone)}) AT TIME ZONE 'UTC'`;
    return `CAST(date_diff('second', ${local}, ${value}) / 60 AS BIGINT)`;
}

/**
 * ## The date predicates relative to "now"
 *
 * `isFuture`, `isPast`, `isToday`, `isTomorrow` and `isYesterday` read `Date.now()` per row in
 * the UDF. The SQL form reads it once, when the query is planned, and compares every row against
 * that. The results differ only for a query that runs across midnight, and then the SQL form is
 * the more consistent one: every row in a result agrees about when "now" was.
 *
 * The day boundaries are computed in JavaScript because `date-fns` uses the Node process's local
 * timezone, while DuckDB's `current_date` would use the session timezone. Each boundary is
 * inserted as a UTC `TIMESTAMP` literal.
*/

/** A naive-UTC `TIMESTAMP` literal for an instant. */
function literal(date: Date): string {
    return `TIMESTAMP '${date.toISOString().slice(0, 23)
        .replace('T', ' ')}'`;
}

/** Local midnight `offset` days from today, as an instant. */
function localMidnight(offset: number): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
}

/** `value` falls on the local day `offset` days from today. */
export function onLocalDay(value: string, offset: number): string {
    return `(${value} >= ${literal(localMidnight(offset))}`
        + ` AND ${value} < ${literal(localMidnight(offset + 1))})`;
}

/** `value` is strictly after the plan-time instant. */
export function afterNow(value: string): string {
    return `${value} > ${literal(new Date())}`;
}

/** `value` is strictly before the plan-time instant. */
export function beforeNow(value: string): string {
    return `${value} < ${literal(new Date())}`;
}
