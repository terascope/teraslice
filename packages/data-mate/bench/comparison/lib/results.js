/**
 * The result file, and the in-flight marker that makes a FATAL abort reportable.
 *
 * Shared by `run.js` (which measures) and `sweep.js` (which supervises), because both have to
 * agree on the shape byte for byte.
 *
 * **Why a marker file exists at all.** A big enough `DataFrame` case does not throw - V8 prints
 * `FATAL ERROR: Ineffective mark-compacts near heap limit` and aborts the process. Nothing
 * in-process can catch that, so the only way to record WHICH case died is to have written it
 * down before starting it. `sweep.js` reads the marker after a non-zero exit and turns it into an
 * `OOM` cell, which is the difference between the report saying "DataFrame cannot do this at 5M"
 * and the report having a hole where its best evidence should be.
*/
import fs from 'node:fs';
import path from 'node:path';

export const RESULTS_FILE = process.env.RESULTS || 'bench/comparison/.results.json';
export const INFLIGHT_FILE = process.env.INFLIGHT || 'bench/comparison/.inflight.json';

/** One row per scale+group+case, holding BOTH engines' halves. */
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
 * Indexes the rows by key so two processes can fill the same row from either side.
 *
 * A per-engine process only ever knows its own half, so replacing a scale's rows - which the
 * runner used to do - discarded the other engine's numbers the moment the second process ran.
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
 * Recomputes the row-count check ACROSS the two halves, whichever process measured them.
 *
 * `SKIPPED` and failed halves report `rows: null`, which is not a mismatch - only two real
 * counts that disagree are.
*/
export function withMismatch(row) {
    row.mismatch = row.df.rows != null && row.duck.rows != null && row.df.rows !== row.duck.rows
        ? `${row.df.rows} vs ${row.duck.rows}`
        : null;
    return row;
}

// ------------------------------------------------------------------ in-flight marker

/** Written BEFORE a half is measured, so a process death can be attributed to it. */
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
