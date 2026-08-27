/**
 * The query battery.
 *
 * **Why more than one shape.** A `count(*)` over Parquet is answered from the
 * footer and touches no data at all, so quoting it as "query performance" is
 * meaningless. These eight shapes each stress a different part of the path, and
 * they disagree with each other by orders of magnitude — which is the finding,
 * not noise:
 *
 *   metadata only    footer read, no column data fetched
 *   selective scan   row-group statistics prune most groups before any fetch
 *   wide top-N       THE memory cliff: threads x row_group x columns projected
 *   aggregation      full column scan, low cardinality
 *   high-card group  full column scan, large hash table
 *   projection       one column, no filter — the best case for columnar storage
 *
 * `{{T}}` is replaced with the table expression, so the same battery runs
 * against a Parquet glob, a view or a materialised table unchanged.
 */

/**
 * Shapes that need no knowledge of the schema. Always run.
 */
export const UNIVERSAL = [
    {
        key: 'count',
        label: 'count(*) [metadata only]',
        sql: 'SELECT count(*) FROM {{T}}',
        note: 'Answered from the Parquet footer. Touches no column data.',
    },
];

/**
 * Shapes built from whatever columns the corpus actually has.
 *
 * The harness does NOT assume a schema — the objects are pre-uploaded and this
 * code has never seen them. Each builder returns null when the corpus lacks a
 * suitable column, and the battery reports it as skipped rather than failing.
 */
export function buildBattery(columns) {
    const byType = (predicate) => columns.filter(predicate).map((c) => c.name);

    const numeric = byType((c) => /INT|DOUBLE|FLOAT|DECIMAL|HUGEINT/i.test(c.type));
    const text = byType((c) => /VARCHAR|STRING|CHAR/i.test(c.type));
    const bool = byType((c) => /BOOLEAN/i.test(c.type));
    const temporal = byType((c) => /DATE|TIME/i.test(c.type));

    // Lowest-cardinality text column makes the most honest GROUP BY key, and
    // the highest-cardinality one the most punishing. Cardinality is measured
    // by the battery before these are built.
    const lowCard = columns.filter((c) => c.lowCardinality).map((c) => c.name);
    const highCard = columns.filter((c) => c.highCardinality).map((c) => c.name);

    const q = (name) => `"${String(name).replace(/"/g, '""')}"`;
    const battery = [...UNIVERSAL];

    if (numeric.length) {
        battery.push({
            key: 'project-1',
            label: 'project 1 column, full scan',
            sql: `SELECT sum(${q(numeric[0])}) FROM {{T}}`,
            note: `Reads only ${numeric[0]}. The columnar best case.`,
        });
        battery.push({
            key: 'range',
            label: 'filter: numeric range',
            sql: `SELECT count(*) FROM {{T}} WHERE ${q(numeric[0])} > (SELECT avg(${q(numeric[0])}) FROM {{T}})`,
            note: 'Row-group statistics can prune before any data is fetched.',
        });
    }

    if (bool.length) {
        battery.push({
            key: 'bool-eq',
            label: 'filter: boolean equality',
            sql: `SELECT count(*) FROM {{T}} WHERE ${q(bool[0])} = true`,
            note: 'Cheapest possible predicate; isolates scan overhead.',
        });
    }

    if (lowCard.length) {
        battery.push({
            key: 'agg-low',
            label: 'aggregate: group by low-cardinality key',
            sql: numeric.length
                ? `SELECT ${q(lowCard[0])}, count(*), sum(${q(numeric[0])}) FROM {{T}} GROUP BY 1`
                : `SELECT ${q(lowCard[0])}, count(*) FROM {{T}} GROUP BY 1`,
            note: 'Full column scan, small hash table.',
        });
        battery.push({
            key: 'filter-eq',
            label: 'filter: equality on a low-cardinality column',
            sql: `SELECT count(*) FROM {{T}} WHERE ${q(lowCard[0])} = (SELECT ${q(lowCard[0])} FROM {{T}} WHERE ${q(lowCard[0])} IS NOT NULL LIMIT 1)`,
            note: 'The shape most helped by row-group statistics.',
        });
    }

    if (highCard.length) {
        battery.push({
            key: 'agg-high',
            label: 'aggregate: group by HIGH-cardinality key',
            sql: `SELECT ${q(highCard[0])}, count(*) FROM {{T}} GROUP BY 1`,
            note: 'Full scan into a large hash table. Usually the slowest shape.',
        });
    }

    if (temporal.length && numeric.length) {
        battery.push({
            key: 'time-bucket',
            label: 'aggregate: bucket by time',
            sql: `SELECT date_trunc('day', ${q(temporal[0])}) AS d, count(*) FROM {{T}} GROUP BY 1 ORDER BY 1`,
            note: 'Temporal grouping, the commonest analytical shape.',
        });
    }

    const sortKey = numeric[0] ?? text[0] ?? columns[0]?.name;
    if (sortKey) {
        // Deliberately narrow: the wide form is a separate, dangerous shape.
        const narrow = [sortKey, ...(text[0] && text[0] !== sortKey ? [text[0]] : [])];
        battery.push({
            key: 'topn-narrow',
            label: `top 100, ${narrow.length} column(s) projected`,
            sql: `SELECT ${narrow.map(q).join(', ')} FROM {{T}} ORDER BY ${q(sortKey)} DESC LIMIT 100`,
            note: 'The safe top-N. Memory scales with columns projected, so this is cheap.',
        });
        battery.push({
            key: 'topn-wide',
            label: 'top 100, SELECT * (THE MEMORY CLIFF)',
            sql: `SELECT * FROM {{T}} ORDER BY ${q(sortKey)} DESC LIMIT 100`,
            note: 'Needs threads x row_group x ALL columns. This is the one shape that '
                + 'FAILS rather than degrades under memory pressure. Never emit it in production.',
            dangerous: true,
        });
    }

    return battery;
}
