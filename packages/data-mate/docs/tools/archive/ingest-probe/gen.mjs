// Deterministic record generator. Fixed LCG seed, no Date.now(), no Math.random().
// Shape mirrors what the spaces search API returns for a realistic index:
// scalars across the numeric ladder, a nested geo point, a keyword array, a nested object.

const FIELDS = {
    _key: { type: 'Keyword' },
    ip: { type: 'IP' },
    host: { type: 'Hostname' },
    bytes: { type: 'Integer' },
    total: { type: 'Long' },
    duration: { type: 'Double' },
    ratio: { type: 'Float' },
    level: { type: 'Byte' },
    port: { type: 'Short' },
    active: { type: 'Boolean' },
    created: { type: 'Date', is_primary_date: true },
    status: { type: 'Keyword' },
    label: { type: 'Text' },
    loc: { type: 'GeoPoint' },
    tags: { type: 'Keyword', array: true },
    'meta.region': { type: 'Keyword' },
    'meta.tier': { type: 'Integer' },
    meta: { type: 'Object' },
};

export const TYPE_CONFIG = { version: 1, fields: FIELDS };

// FieldType -> DuckDB type. Integer maps to BIGINT because data-mate's Integer
// bound is JS safe-integer, not int32.
export const DUCK_COLUMNS = {
    _key: 'VARCHAR',
    ip: 'VARCHAR',
    host: 'VARCHAR',
    bytes: 'BIGINT',
    total: 'BIGINT',
    duration: 'DOUBLE',
    ratio: 'FLOAT',
    level: 'TINYINT',
    port: 'SMALLINT',
    active: 'BOOLEAN',
    created: 'TIMESTAMP',
    status: 'VARCHAR',
    label: 'VARCHAR',
    loc: 'STRUCT(lat DOUBLE, lon DOUBLE)',
    tags: 'VARCHAR[]',
    meta: 'STRUCT(region VARCHAR, tier BIGINT)',
};

export const DDL = `(
    _key VARCHAR, ip VARCHAR, host VARCHAR, bytes BIGINT, total BIGINT,
    duration DOUBLE, ratio FLOAT, level TINYINT, port SMALLINT, active BOOLEAN,
    created TIMESTAMP, status VARCHAR, label VARCHAR,
    loc STRUCT(lat DOUBLE, lon DOUBLE), tags VARCHAR[],
    meta STRUCT(region VARCHAR, tier BIGINT)
)`;

const REGIONS = ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-south-1', 'sa-east-1'];
const STATUSES = ['ok', 'warn', 'error', 'timeout', 'refused'];
const TAGS = ['alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta'];
// fixed base instant; no Date.now() so runs are byte-identical
const BASE_MS = Date.parse('2026-01-01T00:00:00.000Z');

function lcg(seed) {
    let s = seed >>> 0;
    return () => {
        s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
        return s / 4294967296;
    };
}

export function makeRecords(n, seed = 42) {
    const r = lcg(seed);
    const out = new Array(n);
    for (let i = 0; i < n; i++) {
        const nTags = Math.floor(r() * 4);
        out[i] = {
            _key: `k-${i}`,
            ip: `${1 + Math.floor(r() * 223)}.${Math.floor(r() * 256)}.${Math.floor(r() * 256)}.${1 + Math.floor(r() * 254)}`,
            host: `host-${Math.floor(r() * 5000)}.example.com`,
            bytes: Math.floor(r() * 2_000_000),
            total: Math.floor(r() * 9_000_000_000),
            duration: Math.round(r() * 1e6) / 1000,
            ratio: Math.round(r() * 1e4) / 1e4,
            level: Math.floor(r() * 127),
            port: Math.floor(r() * 32767),
            active: r() > 0.5,
            created: new Date(BASE_MS + Math.floor(r() * 86_400_000 * 180)).toISOString(),
            status: STATUSES[Math.floor(r() * STATUSES.length)],
            label: `event ${Math.floor(r() * 100000)} recorded`,
            loc: { lat: Math.round((r() * 180 - 90) * 1e5) / 1e5, lon: Math.round((r() * 360 - 180) * 1e5) / 1e5 },
            tags: Array.from({ length: nTags }, () => TAGS[Math.floor(r() * TAGS.length)]),
            meta: { region: REGIONS[Math.floor(r() * REGIONS.length)], tier: Math.floor(r() * 5) },
        };
    }
    return out;
}
