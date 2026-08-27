// Runners: put the same value through data-mate and through DuckDB, comparably.
import api from '@duckdb/node-api';
const { DuckDBInstance } = api;

const DIST = '/Users/jarednoble/Projects/terascope/teraslice/packages/data-mate/dist/src/index.js';
const TYPES = '/Users/jarednoble/Projects/terascope/teraslice/packages/types/dist/src/index.js';
export const mate = await import(DIST);
export const { FieldType } = await import(TYPES);

let _conn;
/** One shared connection. TZ pinned to UTC - without this every TIMESTAMPTZ result shifts. */
export async function duck() {
    if (_conn) return _conn;
    const inst = await DuckDBInstance.create(':memory:', { threads: '2', memory_limit: '2GB' });
    _conn = await inst.connect();
    await _conn.run(`SET TimeZone='UTC'`);
    for (const ext of ['icu', 'inet', 'spatial']) {
        try { await _conn.run(`INSTALL ${ext}`); await _conn.run(`LOAD ${ext}`); } catch { /* recorded by caller */ }
    }
    return _conn;
}

export async function loadedExtensions() {
    const c = await duck();
    const r = await c.runAndReadAll(
        `SELECT extension_name FROM duckdb_extensions() WHERE loaded ORDER BY 1`);
    return r.getRows().map((x) => x[0]);
}

/**
 * data-mate coercion of ONE value. Per-value because fromJSON throws on the first
 * bad value in a batch, which would mask every later value.
 */
export function mateCoerce(type, value, childConfig) {
    try {
        const cfg = childConfig ? { type, ...childConfig } : { type };
        const col = mate.Column.fromJSON('v', cfg, [value]);
        return { ok: true, value: col.toJSON()[0] };
    } catch (err) {
        return { ok: false, error: String(err.message).split('\n')[0] };
    }
}

/** data-mate function applied over a whole battery (one Column, one adapter pass). */
export function mateFn(name, type, values, args) {
    const fnDef = mate.functionConfigRepository[name];
    if (!fnDef) return { ok: false, error: `no such function: ${name}` };
    try {
        const col = mate.Column.fromJSON('v', { type }, values);
        const adapter = mate.dataFrameAdapter(fnDef, args ? { args, field: 'v' } : { field: 'v' });
        return { ok: true, values: adapter.column(col).toJSON() };
    } catch (err) {
        return { ok: false, error: String(err.message).split('\n')[0] };
    }
}

/**
 * data-mate function applied ONE VALUE AT A TIME.
 * Necessary because both fromJSON coercion and the adapter throw on the first bad value
 * in a batch, which would otherwise mask every value after it. Returns per-value
 * `{ ok, value }` so a rejection is recorded rather than losing the whole battery.
 */
export function mateFnEach(name, type, values, args) {
    const fnDef = mate.functionConfigRepository[name];
    if (!fnDef) return values.map(() => ({ ok: false, error: `no such function: ${name}` }));
    const adapter = (() => {
        try { return mate.dataFrameAdapter(fnDef, args ? { args, field: 'v' } : { field: 'v' }); } catch { return null; }
    })();
    if (!adapter) return values.map(() => ({ ok: false, error: 'adapter construction failed' }));
    return values.map((v) => {
        try {
            const col = mate.Column.fromJSON('v', { type }, [v]);
            return { ok: true, value: adapter.column(col).toJSON()[0] };
        } catch (err) {
            return { ok: false, error: String(err.message).split(';')[0] };
        }
    });
}

const esc = (v) => (v == null ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`);

/** Evaluate a SQL expression over a battery. `v` is the staged VARCHAR column. */
export async function duckExpr(sql, values) {
    const c = await duck();
    try {
        await c.run('CREATE OR REPLACE TEMP TABLE _b (i INTEGER, v VARCHAR)');
        if (values.length) {
            await c.run(`INSERT INTO _b VALUES ${values.map((x, i) => `(${i},${esc(x)})`).join(',')}`);
        }
        const r = await c.runAndReadAll(`SELECT (${sql}) AS o FROM _b ORDER BY i`);
        return { ok: true, values: r.getRowsJson().map((row) => row[0]) };
    } catch (err) {
        return { ok: false, error: String(err.message).split('\n')[0] };
    }
}

/** Normalize both sides to a comparable shape. */
export function norm(x) {
    if (x == null) return null;
    if (typeof x === 'bigint') return x.toString();
    if (typeof x === 'number') {
        if (!Number.isFinite(x)) return String(x);
        return Number.isInteger(x) ? x : Number(x.toPrecision(10));
    }
    if (typeof x === 'string') {
        // duckdb returns numerics as strings via getRowsJson; fold to number when lossless
        if (/^-?\d+$/.test(x) && Math.abs(Number(x)) <= Number.MAX_SAFE_INTEGER) return Number(x);
        if (/^-?\d*\.\d+$/.test(x)) return Number(Number(x).toPrecision(10));
        return x;
    }
    if (Array.isArray(x)) return x.map(norm);
    if (typeof x === 'object') {
        if ('items' in x) return norm(x.items);
        if ('entries' in x) return norm(x.entries);
        if ('micros' in x) return norm(x.micros);
        const out = {};
        for (const k of Object.keys(x).sort()) out[k] = norm(x[k]);
        return out;
    }
    return x;
}
export const same = (a, b) => JSON.stringify(norm(a)) === JSON.stringify(norm(b));
