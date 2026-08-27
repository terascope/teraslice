/**
 * The fixture corpus, as ONE SQL SELECT.
 *
 * **Why SQL and not `bench/comparison/lib/generate.js`.** That generator builds JS objects and
 * is the right thing for a 5M-row comparison. At 1B rows it is not reachable at any price, so
 * the fixture is generated entirely inside DuckDB from `range(n)`.
 *
 * **The shape is deliberately identical** to that generator's `CONFIG` — the same 30 fields,
 * the same DuckDB types, the same cardinalities, the same two deliberately-sparse columns — so a
 * number taken against a fixture stays comparable with the recorded benchmarks.
 *
 * **The ENTROPY is deliberately NOT identical, and this is the whole point of the file.**
 * `makeRecords` builds values with `i % N` and linear sequences (`total: 1000000 + i * 7`,
 * `email: user${i}@example.com`). Those are perfectly periodic, so Parquet's dictionary and delta
 * encodings crush them — and `HANDOFF.md` records the consequence directly: **a generator using
 * `i % N` compresses about 2x better than real data.** Fixture data that compresses twice as well
 * as production data makes every query measured against it optimistic, forever, and this fixture
 * is going to production.
 *
 * So every HIGH-cardinality column is derived from `hash()` instead of from `i`:
 *
 * | column kind | generator | why |
 * |---|---|---|
 * | low-card (`category`, `status`) | fixed lists | real data IS low-card here |
 * | high-card text (`_key`, `name`) | `hash()`-derived | must not dictionary-compress |
 * | numerics | `hash()`-derived | a linear sequence delta-encodes to nothing |
 * | `subnet` | always NULL | a declared column nothing populates |
 * | `expires` | NULL on even rows | half-null defeats every shortcut |
 *
 * **Query semantics are preserved on purpose.** The report battery's predicates have to keep
 * selecting what they selected before, or the fixture silently changes what the benchmark means:
 *
 * | predicate | selectivity here |
 * |---|---|
 * | `active = true AND category = 'gamma'` | ~10% |
 * | `amount BETWEEN 100 AND 5000` | ~90% (amount spans 0-1000, as in the original) |
 * | `email LIKE 'user1%'` | exactly 10% (fixed-width digits) |
 * | `category IN ('alpha','gamma')` | 40% |
 * | `status = 'active'` | 25% |
 * | `GROUP BY name` | ~100,000 groups |
 *
 * **Calibrated, not guessed.** A first cut made every high-cardinality column pure hash noise
 * and landed at **115.7 MB per million rows** — against **28 MB/million** for the periodic
 * generator. Since `HANDOFF.md` records that the periodic one compresses about 2x better than
 * real data, real data sits near **56 MB/million**, and 115.7 overshoots it by as much as 28
 * undershoots. Per-column measurement showed why: `email`/`emails` at a billion distinct values
 * (real users recur), `ratio`/`ratios` as effectively random bits, and a near-unique
 * `description`. Those were pulled back to realistic cardinalities; `_key` was left at full
 * entropy because a real document id genuinely is random.
 *
 * **If a fixture is wrong in this dimension, every query measured against it is wrong in the
 * same direction, permanently.** Re-measure `bytes/row` after any change here.
 *
 * Deterministic: `hash()` is a pure function of the row index, so any scale regenerates
 * byte-identically on any machine.
 */

/**
 * Independent hash streams from one row index.
 *
 * `hash()` returns UBIGINT, which will not index a list (`array_extract` wants
 * BIGINT) and cannot be cast to one directly — values above 2^63 overflow. The
 * right shift drops one bit so the result always fits a signed 64, keeping 63
 * bits of entropy, which is far more than any column here consumes.
 */
const H = (offset) => `((hash(i + ${offset}) >> 1)::BIGINT)`;

/**
 * The 30-column SELECT. `i` is the row index from `range(n)`.
 *
 * Column ORDER matches the schema `DataType.toDuckDB()` produces, so the Parquet file and a
 * `DuckFrame` built from `CONFIG` agree without reordering.
 */
export const FIXTURE_SELECT = `
SELECT
    -- identifiers and text (6) -------------------------------------------
    -- 16 hex chars of hash: high entropy, so it cannot dictionary-compress.
    printf('key-%016x', ${H(1)})                                  AS "_key",
    -- ~100,000 distinct, matching the original. THE high-card group-by key.
    'name ' || (${H(2)} % 100000)::VARCHAR                          AS "name",
    -- keeps the 'user<n>@example.com' shape so LIKE 'user1%' stays meaningful (~11%).
    -- 2M distinct users, NOT one address per row: in real data a user recurs, and
    -- a near-unique email column is the single easiest way to make a fixture
    -- incompressible in a way production never is.
    -- FIXED WIDTH, and that is load-bearing. The battery's LIKE 'user1%' has to
    -- keep a stable selectivity, and with a variable-width number it does not:
    -- measured at 55.6% for a 0-1,999,999 range, because 1,000,000-1,999,999 is
    -- half the values on its own. Zero-padding to 7 digits over a full decade
    -- makes the leading digit uniform, so user1% is exactly 10%.
    -- 10M distinct users, NOT one address per row: in real data a user recurs.
    'user' || printf('%07d', ${H(3)} % 10000000) || '@example.com'   AS "email",
    -- prose-shaped and high entropy; the widest text column, and a trim() target.
    'record ' || (${H(4)} % 1000000)::VARCHAR
        || ' in category ' || ['alpha','beta','gamma','delta','epsilon'][(${H(5)} % 5) + 1]
        || ' with some prose'                                       AS "description",
    ['alpha','beta','gamma','delta','epsilon'][(${H(5)} % 5) + 1]   AS "category",
    ['active','pending','archived','failed'][(${H(6)} % 4) + 1]     AS "status",

    -- numerics, every width (7) -------------------------------------------
    (${H(7)} % 127)::TINYINT                                        AS "flags",
    (18 + (${H(8)} % 80))::SMALLINT                                 AS "age",
    (${H(9)} % 1000000)::BIGINT                                     AS "count",
    (1000000 + (${H(10)} % 100000000))::HUGEINT                     AS "total",
    ((${H(11)} % 1000000) / 100.0)::DOUBLE                          AS "score",
    ((${H(12)} % 1000000) / 1000000.0)::DOUBLE                      AS "ratio",
    -- spans 0-1000, so BETWEEN 100 AND 5000 keeps its ~90% selectivity.
    -- ~2% NULL, because real data is not dense and a null takes a different path.
    CASE WHEN (${H(13)} % 100) < 2 THEN NULL
         ELSE ((${H(14)} % 1000000) / 1000.0) END::DOUBLE           AS "amount",

    -- booleans (2) ---------------------------------------------------------
    ((${H(15)} % 2) = 0)                                            AS "active",
    ((${H(16)} % 3) = 0)                                            AS "verified",

    -- dates (3) ------------------------------------------------------------
    (TIMESTAMP '2026-01-01 00:00:00' + INTERVAL (${H(17)} % 31536000) SECOND)  AS "created",
    (TIMESTAMP '2026-01-01 00:00:00' + INTERVAL (${H(18)} % 31536000) SECOND)  AS "updated",
    -- HALF NULL, on the even rows - deliberate, see the table above.
    CASE WHEN i % 2 = 0 THEN NULL
         ELSE TIMESTAMP '2027-01-01 00:00:00' + INTERVAL (${H(19)} % 31536000) SECOND
    END                                                              AS "expires",

    -- network (2) ----------------------------------------------------------
    '10.' || (${H(20)} % 255)::VARCHAR || '.' || (${H(21)} % 255)::VARCHAR
        || '.' || (${H(22)} % 255)::VARCHAR                          AS "ip",
    -- ALWAYS NULL: a declared field nothing ever populates.
    NULL::VARCHAR                                                    AS "subnet",

    -- geo (1) --------------------------------------------------------------
    {'lat': (-90 + (${H(23)} % 1800) / 10.0)::DOUBLE,
     'lon': (-180 + (${H(24)} % 3600) / 10.0)::DOUBLE}               AS "location",

    -- arrays (7) -----------------------------------------------------------
    [['alpha','beta','gamma','delta','epsilon'][(${H(5)} % 5) + 1],
     ['active','pending','archived','failed'][(${H(6)} % 4) + 1]]    AS "tags",
    [(${H(25)} % 1000)::BIGINT, (${H(26)} % 1000)::BIGINT,
     (${H(27)} % 1000)::BIGINT]                                      AS "scores",
    ['user' || printf('%07d', ${H(3)} % 10000000) || '@example.com',
     'alt' || printf('%07d', ${H(28)} % 10000000) || '@example.org'] AS "emails",
    ['10.' || (${H(20)} % 255)::VARCHAR || '.0.1',
     '192.168.' || (${H(29)} % 255)::VARCHAR || '.1']                AS "ips",
    [(${H(30)} % 2) = 0, (${H(31)} % 2) = 0]                         AS "checks",
    [((${H(32)} % 100000) / 100000.0)::DOUBLE,
     ((${H(33)} % 100000) / 100000.0)::DOUBLE]                       AS "ratios",
    [TIMESTAMP '2026-01-01 00:00:00' + INTERVAL (${H(34)} % 525600) MINUTE,
     TIMESTAMP '2026-06-01 00:00:00' + INTERVAL (${H(35)} % 525600) MINUTE]    AS "timestamps",

    -- nested objects (2 top-level STRUCT columns) --------------------------
    {'source': ['api','batch','stream','manual'][(${H(36)} % 4) + 1],
     'retries': (${H(37)} % 5)::BIGINT,
     'duration': ((${H(38)} % 1000000) / 1000.0)::DOUBLE}            AS "metadata",
    {'kind': ['request','response','event'][(${H(39)} % 3) + 1],
     'size': (${H(40)} % 1000000)::BIGINT}                           AS "payload"
FROM range({{ROWS}}) t(i)
`;

/** The scales this fixture set ships at. `rows` is exact; `label` names the object. */
export const SCALES = {
    '1m': { rows: 1_000_000, label: '1m' },
    '10m': { rows: 10_000_000, label: '10m' },
    '100m': { rows: 100_000_000, label: '100m' },
    '1b': { rows: 1_000_000_000, label: '1b' },
    '10b': { rows: 10_000_000_000, label: '10b' },
};

/** Bumped when the schema or the generators change; old fixtures stay readable and distinct. */
export const FIXTURE_VERSION = 'v1';

/** `qpl-fixture-v1-100m.parquet` — self-describing, greppable, sorts sensibly. */
export const fixtureName = (scale) => `qpl-fixture-${FIXTURE_VERSION}-${scale}.parquet`;

/** One bucket, one prefix per scale. See fixtures/README.md for why. */
export const fixturePrefix = (scale) => `${FIXTURE_VERSION}/${scale}`;

export const fixtureSql = (rows) => FIXTURE_SELECT.replace('{{ROWS}}', String(rows));
