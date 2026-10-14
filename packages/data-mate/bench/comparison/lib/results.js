/**
 * The result file, and the in-flight marker that lets a fatal abort be reported.
 *
 * Shared by `run.js`, which measures, and `sweep.js`, which supervises, so both use the same
 * format.
 *
 * A large enough `DataFrame` case does not throw: V8 prints `FATAL ERROR: Ineffective
 * mark-compacts near heap limit` and aborts the process. The only way to know which case died is
 * to write it down before starting it. After a non-zero exit, `sweep.js` reads the marker and
 * records that case as `OOM` instead of leaving it blank.
*/
import fs from 'node:fs';
import path from 'node:path';

export const RESULTS_FILE = process.env.RESULTS || 'bench/comparison/.results.json';
export const INFLIGHT_FILE = process.env.INFLIGHT || 'bench/comparison/.inflight.json';

/** One row per scale, group and case, holding both engines' results. */
export const keyOf = (scale, group, name) => `${scale}::${group}::${name}`;

export function loadResults(file = RESULTS_FILE) {
    try {
        return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch {
        return { rows: [], lifecycleRows: [] };
    }
}

export function saveResults(state, file = RESULTS_FILE) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(state));
}

/** A half this process did not measure, so the report can say so rather than crash. */
export const NOT_RUN = { ms: null, rows: null, note: 'not run' };

/**
 * Indexes the rows by key, so that separate per-engine processes each fill in their own half of
 * the same row without overwriting the other's.
*/
export function indexRows(rows) {
    return new Map(rows.map((row) => [keyOf(row.scale, row.group, row.name), row]));
}

/** An existing row for this case, or a fresh one with both halves marked unmeasured. */
export function rowFor(index, { scale, group, name }) {
    return index.get(keyOf(scale, group, name)) ?? {
        group, name, scale, df: { ...NOT_RUN }, duck: { ...NOT_RUN },
    };
}

/**
 * Recomputes the row-count check across both halves, whichever process measured them. Skipped
 * and failed halves report `rows: null`, which never counts as a mismatch.
*/
export function withMismatch(row) {
    row.mismatch = row.df.rows != null && row.duck.rows != null && row.df.rows !== row.duck.rows
        ? `${row.df.rows} vs ${row.duck.rows}`
        : null;
    return row;
}

// ------------------------------------------------------------------ in-flight marker

/** Written before a half is measured, so a process death can be attributed to it. */
export function markInflight(entry, file = INFLIGHT_FILE) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(entry));
}

export function readInflight(file = INFLIGHT_FILE) {
    try {
        return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch {
        return null;
    }
}

export function clearInflight(file = INFLIGHT_FILE) {
    try {
        fs.unlinkSync(file);
    } catch { /* never written, or already gone */ }
}
