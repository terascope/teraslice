/**
 * The corpus for the DataFrame-vs-DuckFrame comparison: 30 fields, deterministic.
 *
 * **Deterministic on purpose.** A seeded LCG, not `Math.random()`, so every run of every scale
 * gets byte-identical records. Two engines being compared must be given the same data, and a
 * number recorded today has to mean the same thing tomorrow.
 *
 * **Values stay inside their type's range on purpose too.** `Byte` and `Short` bounds, and
 * `Long` above `MAX_SAFE_INTEGER`, are known divergences between the two engines (the shelved
 * defect list in docs/HANDOFF.md). Feeding those here would measure error paths instead of
 * throughput, and would make one engine fail where the other does not.
*/

/** 30 fields, spread across the type system rather than 30 keywords. */
export const CONFIG = {
    version: 1,
    fields: {
        // identifiers and text (6)
        _key: { type: 'Keyword' },
        name: { type: 'Keyword' },
        email: { type: 'Keyword' },
        description: { type: 'Text' },
        category: { type: 'Keyword' },
        status: { type: 'Keyword' },
        // numerics, every width (7)
        flags: { type: 'Byte' },
        age: { type: 'Short' },
        count: { type: 'Integer' },
        total: { type: 'Long' },
        score: { type: 'Float' },
        ratio: { type: 'Double' },
        amount: { type: 'Number' },
        // booleans (2)
        active: { type: 'Boolean' },
        verified: { type: 'Boolean' },
        // dates (3)
        created: { type: 'Date' },
        updated: { type: 'Date' },
        expires: { type: 'Date' },
        // network (2). `subnet` is declared but NEVER populated - see EMPTY_FIELDS.
        ip: { type: 'IP' },
        subnet: { type: 'Keyword' },
        // geo (1)
        location: { type: 'GeoPoint' },
        // arrays (7)
        tags: { type: 'Keyword', array: true },
        scores: { type: 'Integer', array: true },
        emails: { type: 'Keyword', array: true },
        ips: { type: 'IP', array: true },
        checks: { type: 'Boolean', array: true },
        ratios: { type: 'Double', array: true },
        timestamps: { type: 'Date', array: true },
        // nested objects (5 declared paths = 2 top-level columns)
        metadata: { type: 'Object' },
        'metadata.source': { type: 'Keyword' },
        'metadata.retries': { type: 'Integer' },
        'metadata.duration': { type: 'Double' },
        payload: { type: 'Object' },
        'payload.kind': { type: 'Keyword' },
        'payload.size': { type: 'Integer' },
    },
};

/**
 * Two columns are deliberately sparse, because real data always has some and the two engines
 * take completely different paths for a null than for a value - DuckDB carries a validity mask
 * per vector, `DataFrame` branches per value.
 *
 * Both are **redundant types**, so nothing else in the corpus loses coverage:
 *
 * - `subnet` (Keyword, and there are five other Keywords) is null in **every** record. A wholly
 *   empty column is extremely common in practice: the field is declared in the DataType because
 *   some other index populates it. It is also the cheapest possible column for either engine, so
 *   it shows what an all-null column actually costs.
 * - `expires` (Date, and there are two other Dates) is null in **half** the records, on the even
 *   ones. Half-null is the interesting case: neither engine can take an all-or-nothing shortcut,
 *   so per-value branching shows up.
*/
export const EMPTY_FIELDS = { allNull: 'subnet', halfNull: 'expires' };

/** Top-level columns a frame actually gets, after dot-notation folding. */
export const COLUMNS = Object.keys(CONFIG.fields).filter((f) => !f.includes('.'));

const CATEGORIES = ['alpha', 'beta', 'gamma', 'delta', 'epsilon'];
const STATUSES = ['active', 'pending', 'archived', 'failed'];
const SOURCES = ['api', 'batch', 'stream', 'manual'];
const KINDS = ['request', 'response', 'event'];

/**
 * Mulberry32 - a small, fast, well-distributed seeded PRNG.
 *
 * Fast matters: generating 5M records must not dominate the benchmark's wall clock, and
 * generation time is excluded from every measurement anyway.
*/
function rng(seed) {
    let state = seed >>> 0;
    return () => {
        state = (state + 0x6D2B79F5) >>> 0;
        let t = state;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/**
 * `count` records against `CONFIG`.
 *
 * ~2% of nullable fields are null, because real data is not dense and both engines take a
 * different path for a null than for a value.
*/
export function makeRecords(count, seed = 1) {
    const random = rng(seed);
    const records = new Array(count);

    for (let i = 0; i < count; i++) {
        const r = random();
        const nullish = r < 0.02;

        records[i] = {
            _key: `key-${i}`,
            name: `name ${Math.floor(r * 100000)}`,
            email: `user${i}@example.com`,
            description: `record ${i} in category ${CATEGORIES[i % 5]} with some prose`,
            category: CATEGORIES[i % 5],
            status: STATUSES[i % 4],

            flags: i % 127,
            age: 18 + (i % 80),
            count: i % 1000000,
            total: 1000000 + (i * 7),
            score: Math.round(r * 10000) / 100,
            ratio: r,
            amount: nullish ? null : Math.round(r * 1000000) / 1000,

            active: i % 2 === 0,
            verified: i % 3 === 0,

            created: `2026-0${1 + (i % 9)}-1${i % 9}T0${i % 9}:00:00.000Z`,
            updated: `2026-0${1 + (i % 9)}-2${i % 8}T1${i % 9}:30:00.000Z`,
            // HALF NULL, on the even records - see EMPTY_FIELDS
            expires: i % 2 === 0 ? null : `2027-0${1 + (i % 9)}-0${1 + (i % 8)}T00:00:00.000Z`,

            ip: `10.${i % 255}.${(i * 3) % 255}.${(i * 7) % 255}`,
            // ALWAYS NULL - a declared field that nothing ever populates
            subnet: null,

            location: { lat: -90 + ((i % 1800) / 10), lon: -180 + ((i % 3600) / 10) },

            tags: [CATEGORIES[i % 5], STATUSES[i % 4]],
            scores: [i % 100, (i * 3) % 100, (i * 7) % 100],
            emails: [`a${i}@example.com`, `b${i}@example.com`],
            ips: [`192.168.${i % 255}.1`, `172.16.${i % 255}.1`],
            checks: [i % 2 === 0, i % 3 === 0],
            ratios: [r, Math.round(r * 1000) / 1000],
            timestamps: [
                `2026-0${1 + (i % 9)}-0${1 + (i % 8)}T00:00:00.000Z`,
                `2026-0${1 + (i % 9)}-1${i % 9}T12:00:00.000Z`,
            ],

            metadata: {
                source: SOURCES[i % 4],
                retries: i % 5,
                duration: Math.round(r * 100000) / 100,
            },
            payload: {
                kind: KINDS[i % 3],
                size: (i * 13) % 65536,
            },
        };
    }

    return records;
}

/** The scales the comparison runs at. `SCALES=1000,5000 node ...` overrides it. */
export const SCALES = (process.env.SCALES
    ? process.env.SCALES.split(',').map((s) => Number(s.trim()))
    : [1_000, 5_000, 10_000, 50_000, 100_000, 500_000, 1_000_000, 3_000_000, 5_000_000]);

export function label(count) {
    if (count >= 1_000_000) return `${count / 1_000_000}M`;
    if (count >= 1_000) return `${count / 1_000}k`;
    return String(count);
}
