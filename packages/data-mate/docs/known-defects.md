# data-mate known defects — `DataFrame` (D1–D6) and `TealFrame` (DF1–DF19)

> **THERE IS NO DF3.** The number was skipped when these were first written up, and `sql-emission.md`
> once cited "known-defects DF3" for the leading-U+FEFF round trip, which had no entry anywhere — that
> finding is now **DF12**. The TealFrame set is **DF1, DF2, DF4–DF19**: eighteen entries.

Every status below was re-checked against `../src/` on 2026-09-15.

| id | defect | status |
|---|---|---|
| [D1](#fixed) | multi-key `orderBy` sums per-field comparisons instead of first-non-zero | **fixed** |
| [D2](#fixed) | a nil makes the comparator non-transitive, misordering **non-nil** values | **fixed** |
| [D3](#fixed) | `reverse()` splits astral characters into lone surrogates | **fixed** |
| [D4](#fixed) | integer coercion truncates at the first non-digit | **fixed** |
| [D5](#d5) | date coercion delegates to the JS `Date` parser | **open**, by design |
| [D6](#d6) | an existing test asserted the buggy output as expected | resolved |
| [DF1](#df1) | a FIELD_VALIDATION on an ARRAY column cannot be expressed at all | open |
| [DF2](#df2) | `ceil`/`floor`/`round` return a wrapped BIGINT as a STRING past `output_type` | open |
| [DF4](#df4) | a `FULL_VALUES` function on an ARRAY column cannot be registered as a UDF | open |
| [DF5](#df5) | `setDefault`'s `output_type` is always `Keyword` | open |
| [DF6](#df6) | `addToDate`/`subtractFromDate` answer differently per SERVER TIMEZONE | open — **ticket** |
| [DF7](#df7) | no geo function can run as a UDF (JSON/STRUCT have no parameter mapping) | open |
| [DF8](#df8) | `geo-utils` reports NOT-contained when a shape merely TOUCHES a hole | open — **ticket** |
| [DF9](#df9) | `isBase64` rejects 99.3% of valid base64 | open — **ticket** |
| [DF10](#df10) | `replaceRegex`'s SQL emission returned different text for `.`, `\s`, `\S`, `[^` | **fixed** |
| [DF11](#df11) | `toJSON` cannot run as a UDF on an integer column | open |
| [DF12](#df12) | a leading U+FEFF is stripped on TealFrame ingest; `DataFrame` keeps it | divergence, pinned |
| [DF13](#df13) | over TLS with a private CA every `rows()` fails while `size()` succeeds | open |
| [DF14](#df14) | every `Long` past 2^53 changed value on the Parquet wire (HUGEINT was written as DOUBLE) | **fixed** 2026-09-28 |
| [DF15](#df15) | a `Long` given as a JS bigint past 2^53 was stored one too low | **fixed** 2026-09-28 |
| [DF16](#df16) | a `GeoJSON` field was stored as JSON TEXT, so every spatial query re-parsed every row | **fixed** 2026-09-28 |
| [DF17](#df17) | a `Tuple` was output as an object `{"0":..,"1":..}`, not an array | **fixed** 2026-09-29 |
| [DF18](#df18) | JSON output followed ONE flag, not `DataFrame`'s seven `SerializeOptions`; the default diverged four ways | **fixed** 2026-09-29 |
| [DF19](#df19) | a double past 1e21 lost its exponent `+`; an integral double in 2^53..1e21 was written as its exact binary value | **fixed** 2026-09-30 |

Tests live with the feature they cover, not in the deleted `known-defects-spec.ts`. Full DuckDB
behavioural comparison: [`duckdb-parity.md`](./duckdb-parity.md).

| defect | tests |
|---|---|
| D1, D2 (frame level) | `test/data-frame-spec.ts` → `->orderBy` |
| D2 (the comparator) | `test/vector/vector-spec.ts` → `->compare` |
| D3 | `test/function-configs/string/reverse-spec.ts` |
| D4 | `packages/core-utils/test/numbers-spec.ts` (root cause), `test/type-coercion-spec.ts` (boundary) |
| D5 | `test/type-coercion-spec.ts`, commented out at the foot — they assert the **correct** behaviour, so they fail today, and a permanently red suite trains people to ignore it |
| DF1–DF13 | `test/teal-frame/sql-emission-spec.ts` — the SQL-vs-UDF parity gate that found most of them |
| DF14, DF15 | `test/teal-frame/long-exact-spec.ts` |
| DF16 | `test/teal-frame/geojson-geometry-spec.ts`, `test/teal-frame/wkb-spec.ts` |
| DF17 | `test/teal-frame/tuple-output-spec.ts` |
| DF18 | `test/teal-frame/serialize-options-spec.ts` - all 128 option sets; `engine-output-spec.ts` |
| DF19 | `test/teal-frame/export-json-spec.ts` -> number rendering |
| **DEF-BIGINT** | **`core-utils` UNFIXED ([#4555](https://github.com/terascope/teraslice/issues/4555)). teal-frame works around it locally — `test/teal-frame/teal-frame-spec.ts` → 'should read large integers back exactly, and agree with ndjson'** |

```
# whole data-mate suite (2026-08-14): 40 suites, 2728 passed, 0 failed
node ../scripts/bin/ts-scripts test ../data-mate
node ../scripts/bin/ts-scripts test ../core-utils -- --testPathPatterns numbers-spec
```

---

<a name="fixed"></a>
## `DataFrame` D1–D4 — fixed and merged (PR #4515)

| id | cause | fix | evidence |
|---|---|---|---|
| **D1** | `Vector.getSortedIndices` **added** the per-field comparisons, so two keys that disagree cancelled to `0`, the comparator said "equal" and input order survived | return the first non-zero comparison | `[{a:'y',b:2},{a:'x',b:1}].orderBy('a:asc','b:desc')` gave `['y2','x1']`; fuzzed over 200 random 3-to-14-row frames, seed 12345, **151/200 (76%) sorted incorrectly** |
| **D2** | `null < 'a'` and `null > 'a'` are *both* false, so a nil compared equal to every string — a non-transitive comparator, which misorders the **non-nil** values too | `Vector.compare` orders nils explicitly as the smallest value (first asc, last desc), the convention the existing `orderBy('age')` tests asserted | 64 rows, ~25% nils, seed 999: sorted `a a a b c c c d …` vs correct `a a a a b b c c …`, first bad value at **index 3**. Rate rises as V8 switches sort strategy — n=8 → 43%, n=32 → 96%, **n≥64 → 100%** |
| **D2b** | for numerics `null < 5` evaluated as `0 < 5`, so a nil sorted as zero | same | `[-10, null, 5, -1, 20]` `.orderBy('n:asc')` gave **`[-10, -1, undefined, 5, 20]`** — visible only when the range spans zero |
| **D3** | `reverse()` ran on UTF-16 code units, splitting surrogate pairs into lone surrogates that will not round-trip through JSON or a database | segment with `Intl.Segmenter` behind a fast path — code-point reversal is **not** enough, it detaches combining marks and turns a regional-indicator pair into a *different flag* | `"😀x"` → **`"x\ude00\ud83d"`**, `"a😀b"` → **`"b\ude00\ud83da"`**, `"👨x"` → **`"x\udc68\ud83d"`** |
| **D4** | `isNumberLike` validated with `Number()` but the converters used `parseInt`/`parseFloat`, prefix parsers that stop at the first character they do not understand — so a value passed the check as one number and was **silently stored as another** | `_parseNumberLike` is now the one parse used by both (`core-utils/src/numbers.ts`) | table below |

D1+D2 cost multi-key sorts 1.73×–2.43× (200k rows, comparator loop only: 52→90 ms at 2 distinct
first-key values, 42→91 at 8, 41→91 at 1,000, 43→104 at 200,000) — not comparator overhead but the cost
of actually sorting, since the old one called 45–53% of pairs equal so TimSort skipped work, making
~253k comparisons over 50k rows where the correct one makes ~714k. Single-key sorts are unaffected.

| D4 input | `Number(input)` | int, before | int, after | float, before | float, after |
|---|---|---|---|---|---|
| `"1e3"` | `1000` | **`1`** | `1000` | `1000` ✅ | `1000` |
| `"-1e3"` | `-1000` | **`-1`** | `-1000` | `-1000` ✅ | `-1000` |
| `"1e-3"` | `0.001` | **`1`** | `0` | `0.001` ✅ | `0.001` |
| `"0x10"` | `16` | **`0`** | `16` | **`0`** | `16` |
| `"0b11"` | `3` | **`0`** | `3` | **`0`** | `3` |
| `"0o17"` | `15` | **`0`** | `15` | **`0`** | `15` |
| `"1,000"` | — | **`1`** | `1000` | **`1`** | `1000` |
| `"1_000"` | — | **`1`** | `1000` | **`1`** | `1000` |
| `"2e21"` | `2e+21` | **`2`** | throws | `2e+21` ✅ | `2e+21` |
| `".5"` | `0.5` | throws | `0` | `0.5` ✅ | `0.5` |
| `"12.7"` | `12.7` | `12` | `12` | `12.7` ✅ | `12.7` |
| `" 7 "` | `7` | `7` ✅ | `7` | `7` ✅ | `7` |

D4's accepted set is unchanged (`isNumberLike` is still the gate) — only the produced values, plus
`"2e21"`-style input now throwing for integer types instead of returning `2`.

<a name="d5"></a>
## D5 — date coercion delegates to the JS `Date` parser — OPEN

`FieldType.Date` routes to `toEpochMSOrThrow` (`core-utils/src/dates.ts:965`), whose `getTime` falls
through to `new Date(value)` for non-ISO input. Left open deliberately: tightening it rejects input that
is accepted today, so production data needs checking first — particularly anything relying on
epoch-as-string dates.

**5a — a bare integer string becomes a year**, though `"1710028800000"` (epoch ms) *is* handled, so the
parser is inconsistent about which numeric forms are epochs and which are years.

| `"0"` | `"1"` | `"99"` | `"2024"` |
|---|---|---|---|
| `2000-01-01T00:00:00.000Z` | `2001-01-01T00:00:00.000Z` | `1999-01-01T00:00:00.000Z` | `2024-01-01T00:00:00.000Z` |

**5b — locale-shaped formats read the process timezone**, so `"Mar 10 2024"` / `"03/10/2024"` store a
different instant per host.

```
TZ=UTC             -> 2024-03-10T00:00:00.000Z
TZ=America/Denver  -> 2024-03-10T07:00:00.000Z
TZ=Asia/Tokyo      -> 2024-03-09T15:00:00.000Z
```

**5b has no test**: under jest the VM context caches the timezone at startup, so changing
`process.env.TZ` mid-run has no effect (verified — even `new Date()` ignores it). Reproduce outside jest
against `dist/src/index.js`; only 5a is asserted, and it shares the root cause.

<a name="d6"></a>
## D6 — a test asserting the buggy output — RESOLVED

Exactly one expectation changed with the D1/D2 fix: `test/data-frame-spec.ts` `'should be able to sort
name:desc and age:desc'` (line 1205) asserted `Jill Billy Frank Nancy Jane` — not sorted by name in
*either* direction — and now asserts `Nancy Jill Jane Frank Billy`. The other four `->orderBy` tests
pass untouched, including `orderBy('age')`, whose nil placement is a convention the fix preserved.

---

## `TealFrame`

Found mostly by `test/teal-frame/sql-emission-spec.ts`, which runs a function through the adapter twice
— as SQL and as its own UDF — and requires the two to agree. None is caused by the emissions; the gate
simply exercised paths nothing else did.

<a name="df1"></a>
### DF1. A FIELD_VALIDATION on an ARRAY column cannot be expressed at all — FIXED 2026-10-07

**FIXED 2026-10-07.** `DataFrame` nulls each failing ELEMENT and keeps the list (`contains('e')` over
`['hello', 'sky', 'tree']` is `['hello', null, 'tree']`; `[]` stays `[]`), so `nullUnlessValid` now emits
`list_transform(col, lambda x : CASE WHEN pred(x) THEN x ELSE NULL END)` where SQL maps over a list, on
both paths. The gate's array check now runs for validations too; it found that the six `FULL_VALUES` geo
predicates' emissions accepted an array column and handed `ST_*` a `GEOMETRY[]`, so they now decline one
(`isScalarColumn`) and the UDF runs them as `DataFrame` does. History below as found.

`tealFrameAdapter` maps per element under `INDIVIDUAL_VALUES`, so the predicate becomes a `BOOLEAN[]`
and the `CASE WHEN <pred> THEN col ELSE NULL END` wrapper fails. Not SQL-specific — the UDF path builds
the identical shape, so `@contains` on any array field is broken on both paths today.

```
Conversion Error: Unimplemented type for cast (BOOLEAN[] -> BOOLEAN)
LINE 1: SELECT * FROM (SELECT CASE WHEN list_transform("field", lambda x : contains(x, 'e')) THEN…
```

The answer has to come from `DataFrame` — per-element nulling
(`list_transform(col, lambda x : CASE WHEN pred(x) THEN x ELSE NULL END)`) or whole-value nulling
(`CASE WHEN list_reduce(list_transform(...), lambda a, b : a AND b) THEN col ELSE NULL END`)? Check
`validateColumnData` and the JS adapter's `_mapValue`; the gate skips the array case rather than
asserting a shape that is wrong on both sides.

<a name="df2"></a>
### DF2. `ceil`/`floor`/`round` return a wrapped BIGINT as a STRING past their output type — FIXED 2026-10-07

**FIXED 2026-10-07, with DF5 and DF11, by one change.** Every `DataFrame` Builder's `_valueFrom` is
`coerceToType(outputConfig)`, so a transform's result is coerced into its declared output type - and the
UDF handed DuckDB the raw result instead. The adapter now coerces every UDF result the same way
(`resultCoercion`), behind the same bigint normaliser ingest uses. `DataFrame` THROWS for `ceil(1e21)`
into an Integer, so TealFrame now does too (the emission's `withinIntegerRange` guard hands those values
to the UDF). It also fixed a silent off-by-one: a UDF's bigint result past 2^53 (`ipToInt` on IPv6) came
out one too LOW. History below as found.

`output_type` is `Integer`; given `1e21` the UDF path produced `"3875820019684212735"` (a wrapped BIGINT
rendered as a string) and `-3875820019684212700` for `-1e21`, where the plain SQL expression returns the
correct `1e+21` — `Math.ceil(1e21)` is `1e21`, so the JS is right and the conversion into the declared
output type is where it is lost. `-0` is a smaller second divergence (SQL preserves it, the UDF
normalises it to `0`).

This blocks promoting the three; establish what `DataFrame` returns at `1e21` first, since that decides
whether the fix is in the converter or in the declared `output_type`. The emissions currently guard with
`withinIntegerRange` and keep the UDF above it.

<a name="df4"></a>
### DF4. A `FULL_VALUES` function on an ARRAY column cannot be registered as a UDF — FIXED 2026-10-07

**FIXED 2026-10-07** with DF7: the UDF layer now registers the full field config (`udf-types.ts`), so a
`FULL_VALUES` function over `DOUBLE[]` is `dm_addvalues(DOUBLE[])`, and a result is typed from the
function's `output_type` applied to ONE call's input - so `split` returns `VARCHAR[]`, and on an array
column `VARCHAR[][]`. Pinned by `test/teal-frame/udf-types-spec.ts`; the history below is as found.

`registerScalarFunction` takes `parameter: FieldType`, a bare scalar type with no list form, so
`tealFrameAdapter` registers `dm_addvalues(DOUBLE)` for a `DOUBLE[]` column and the query fails to bind.
That is every `*Values` reducer — `addValues`, `subtractValues`, `multiplyValues`, `divideValues`,
`maxValues`, `minValues` — so **they have never worked on the TealFrame UDF path at all**.

```
Binder Error: No function matches the given name and argument types 'dm_addvalues_ebqori(DOUBLE[])'.
Candidate functions:
	dm_addvalues_ebqori(DOUBLE) -> DOUBLE
```

All six now run as SQL (`list_sum`, `list_product`, `list_max`, `list_min`, plus a `list_reduce` fold for
the two order-dependent ones), proved against `config.create()` called directly in JavaScript
(`arrayOnly` in the gate) because there is no UDF to compare with. Fixing the UDF layer means a list
parameter type in `scalar-function.ts` plus an input converter that unwraps a list vector.

<a name="df5"></a>
### DF5. `setDefault`'s `output_type` is always `Keyword`, whatever the input was — FIXED 2026-10-07

**FIXED 2026-10-07** by result coercion (see DF2): `DataFrame` coerces the default into the declared
`Keyword`, so `setDefault({ value: 0 })` on an Integer column gives `"5"`, `"-12"`, `"0"`, and TealFrame
now gives the same. The `output_type` itself is unchanged - it is the published behaviour.

```ts
output_type(inputConfig) { return { field_config: { ..., type: FieldType.Keyword } }; }
```

The implementation returns the value unchanged, so on any non-string column the UDF hands a non-string
to a VARCHAR result and DuckDB answers `Invalid Input Error: A string was expected` — broken before any
emission exists, which is why the emission claims a string column with a string default and nothing
else. The fix is a config decision: either `output_type` preserves the input type or the implementation
stringifies, and `DataFrame`'s behaviour decides which.

<a name="df6"></a>
### DF6. `addToDate`/`subtractFromDate` give a different answer per SERVER TIMEZONE — TICKET

**For a `core-utils` ticket** — `dates.ts:725` (`add`) and `:741` (`sub`). `date-fns`' `add`/`sub`
operate on LOCAL WALL-CLOCK time while the rest of the pipeline treats the value as naive UTC; measured
2026-08-19 over a 12-argument × 7-date matrix.

| TZ | `addToDate('1900-03-01T00:00:00Z', { months: 1 })` |
|---|---|
| `UTC` | `1900-04-01T00:00:00Z` |
| `Asia/Kolkata` | `1900-04-01T00:00:00Z` |
| `America/New_York` | **`1900-03-29T00:00:00Z`** |

Midnight UTC is the previous day under a negative offset, so the month is added to February instead of
March; the same mechanism hits day and week units across DST (`+ { days: 1 }` over 2026-03-08 adds 23
hours in New York, 24 in UTC). Hours/minutes/seconds are exact epoch arithmetic on both sides and never
diverge, `milliseconds` is silently ignored by both (`date-fns`' `Duration` has no such key), and
`getTimeBetween` is NOT affected — its `differenceInDays`/`differenceInWeeks` are epoch-based despite
the names, and only its `calendar*` family is local.

The emission claims time units only and calendar units keep the UDF: a UTC expression cannot reproduce a
timezone-dependent answer, and reproducing one is not obviously the goal — the same query would answer
differently on two workers in different regions.

<a name="df7"></a>
### DF7. No geo function can run as a UDF — JSON and STRUCT types have no parameter mapping — FIXED 2026-10-07

**FIXED 2026-10-07.** `udfTypeFor` (`src/teal-frame/udf-types.ts`) builds the type object from the
FULL field config, mirroring `toDuckDB()`: `LIST(...)`, `STRUCT(...)` for GeoPoint and declared
Object/Tuple children, `GEOMETRY` for GeoJSON, and JSON (a VARCHAR aliased `JSON`) for `Any` and untyped
Object. `makeInputConverter` undoes each encoding on the way in (a GEOMETRY through `wkbToGeoShape`,
never a `JSON.parse`). Every geo function, the reducers, `split`, `extract`, `parseJSON`, `lookup`,
`toGeoPoint` and `toGeoJSON` now run as UDFs, byte-equal to `DataFrame` (`udf-types-spec.ts`), and the
emission gate compares every case against its real UDF - `noUdfPath` and the compare-to-`create()`
branch are gone. The function sweep runs **148** of 205 end to end, up from 140, with no `unmapped_type`
left. The history below is as found.

```
// scalar-function.ts PARAMETER_TYPES
// - GeoJSON / Any are JSON, and the binding exports no JSON type constant.
// - GeoPoint / Geo / Boundary / Object / Tuple are STRUCTs, which need a type built at
//   runtime rather than a constant.
```

Registering one throws `Field type "GeoJSON" cannot be a scalar function parameter or result yet`, which
is the right call — accepting VARCHAR would produce a column whose type contradicts the DataType config
— but **all 15 geo functions are unusable on the UDF path**, along with anything taking an `Object`,
`Tuple` or `GeoPoint`. So the SQL emission is the only way they can run, the four promoted so far are
proved against `config.create()` in JavaScript (`noUdfPath`), and fixing it means building DuckDB type
objects at runtime rather than looking up constants.

**Update 2026-09-28 — half the stated cause is gone.** A `GeoJSON` field is no longer JSON; it is a
`GEOMETRY` (DF16), for which the binding HAS a type (`DuckDBGeometryType`). What is left of DF7 is the
type-object mapping itself — GEOMETRY, and the runtime-built STRUCT/LIST types for `GeoPoint`, `Object`,
`Tuple` — plus an input converter that unwraps `DuckDBGeometryValue` (via `wkbToGeoShape`) and
`DuckDBStructValue`. **A UDF must never need `JSON.parse` for a GeoJSON value**: that would be undoing our
own serialization, which is what DF16 removed.

<a name="df8"></a>
### DF8. `geo-utils` reports a shape as NOT contained when it merely TOUCHES a hole — TICKET

**For the turf/geo-utils ticket.** Measured on `@turf/*` **7.4.0** (the repo's `package.json` said
`~7.4.0` while `node_modules` held 7.3.5 until `pnpm install` was run); the SQL emissions use `ST_*`,
which is geometrically correct, so these are the inputs where TealFrame deliberately differs.

```js
import { geoContains } from '@terascope/geo-utils';

const holed = { type: 'Polygon', coordinates: [
    [[0, 0], [0, 10], [10, 10], [10, 0], [0, 0]],   // shell
    [[4, 4], [4, 6], [6, 6], [6, 4], [4, 4]],       // hole
]};
const square = { type: 'Polygon', coordinates: [[[0, 0], [0, 4], [4, 4], [4, 0], [0, 0]]] };

geoContains(holed, square);   // => false   WRONG;  DuckDB ST_Contains => true

// holed contains square 0..4      turf=false  sql=true    <-- diverges
// holed contains 0..1 and 8..9    turf=true   sql=true     (nowhere near the hole)
// sq    contains square 0..4      turf=true   sql=true     (no hole at all)
```

`square` occupies `0..4` and the hole starts at `4`, so they meet only at the point `(4,4)` and the
square's interior never enters the hole. **Cause:** `geoContainsFP`
(`packages/geo-utils/src/index.ts:394`) tests each hole with `intersect` = `@turf/boolean-intersects`,
which is **boundary-inclusive**, so "touches the hole" is read as "is inside the hole"; the fix is
presumably an interior-overlap test (area of intersection > 0, or `booleanOverlap`).

| function | input | argument | `geo-utils` | SQL (correct) |
|---|---|---|---|---|
| `geoContains` | shell `0..10` hole `4..6` | square `0..4` | `false` | **`true`** |
| `geoContains` | shell `0..10` hole `4..6` | MultiPolygon `0..4` + `6..10` | `false` | **`true`** |
| `geoWithin` | MultiPolygon `0..4` + `6..10` | shell `0..10` hole `4..6` | `false` | **`true`** |
| `geoRelation` `contains` | shell `0..10` hole `4..6` | square `0..4` | `false` | **`true`** |
| `geoRelation` `within` | square `0..4` | shell `0..10` hole `4..6` | `false` | **`true`** |
| `geoRelation` `contains` | shell `0..10` hole `4..6` | point `(4,5)` on the hole edge | `true` | **`false`** |
| `geoContainsPoint` | shell `0..10` hole `4..6` | point `(4,5)` on the hole edge | `true` | **`false`** |

The last two are the same difference in the other direction — a point exactly on the hole's edge is on
the POLYGON'S BOUNDARY, so `ST_Contains` is false while `booleanPointInPolygon` defaults to
`ignoreBoundary: false` and calls it inside. `geoIntersects` and `geoDisjoint` are **unaffected**,
identical on all 324 pairs.

**Separately, `geoPointWithinRange` is not a distance test:** `makeGeoCircle` calls `@turf/circle`,
which builds a **64-sided inscribed polygon**, so a band of about `r · (1 − cos(π/64))` is wrongly
excluded — ~1.2 km at a 1000 km radius, ~120 m at 100 km, and
`geoPointWithinRange({lat:0,lon:0}, '1000km', pointAtTrueDistance(998_867))` is `false`. The emission
uses `ST_Distance_Sphere`, which has no such band. Probe: `docs/tools/probe/geo-predicates.mjs`.

<a name="df9"></a>
### DF9. `isBase64` rejects 99.3% of valid base64 — it only accepts base64 of UTF-8 TEXT — TICKET

**For a `core-utils` ticket** — `packages/core-utils/src/strings.ts:517`, still present as written.
`validator.isBase64` is already complete and correct; the round trip added after it decodes the payload
**as UTF-8**, and `toString('utf8')` replaces every non-UTF-8 byte sequence with U+FFFD, which cannot
re-encode to the original — so the check silently requires that the decoded bytes be text, failing at
base64's own purpose of carrying arbitrary binary.

```ts
export function isBase64(input: unknown): boolean {
    if (!isString(input)) return false;
    if (validator.isBase64(input)) {
        const decode = Buffer.from(input, 'base64').toString('utf8');
        const encode = Buffer.from(decode, 'utf8').toString('base64');
        return input === encode;   // <-- lossy
    }
    return false;
}
```

Measured 2026-08-20 over 2,000 random payloads of each kind: base64 of random 9-byte **binary** was
rejected **1,987 / 2,000 = 99.3%** of the time, base64 of random ASCII **text** 0 / 2,000 = 0.0%.

```js
isBase64('abcd');   // false  — decodes to 69 b7 1d, not valid UTF-8
isBase64('////');   // false  — decodes to ff ff ff
isBase64('++++');   // false  — decodes to fb ef be
isBase64('AAAA');   // true   — decodes to 00 00 00, which IS valid UTF-8
```

That last line is the tell: validity currently depends on the *content* of the bytes encoded. **The fix
is to delete the round trip** — if the intent was "base64 of readable text" that is a different
predicate and deserves a different name. The SQL emission already implements the correct behaviour,
RFC 4648 with padding (empty string accepted before the length check, matching `validator`; `'a==='`
still rejected):

```sql
x = '' OR (length(x) % 4 = 0 AND regexp_matches(x, '^[A-Za-z0-9+/]+={0,2}$'))
```

<a name="df10"></a>
### DF10. `replaceRegex`'s SQL emission returned different TEXT for `.`, `\s`, `\S` and negated classes

**Found and FIXED on this branch, 2026-08-21**, in the emission promoted by `6427b2e`. `isRe2Safe`
rejects lookaround and backreferences because RE2 cannot COMPILE them and the query ERRORS — right, but
narrower than the question being asked, since a pattern both engines compile can still MATCH different
characters, and then nothing errors.

| construct | verdict, over the 28 characters where the definitions could differ |
|---|---|
| `\s` | **diverges on 20.** JS's `\s` is `WhiteSpace` + `LineTerminator` (VT, NBSP, all of `Zs`, U+2028, U+2029, the BOM); RE2's is exactly `[\t\n\f\r ]` |
| `\S` | inverts on the same 20 |
| `.` | **diverges on 3.** JS's `.` excludes CR, U+2028 and U+2029 as well as LF; RE2's excludes only LF |
| `\w`, `\d`, `\b` | **agree on all 28** — both ASCII-only, so a pattern built from these needs no guard |

A second half: a construct matching "any character" consumes one **UTF-16 code unit** in JS and one
**code point** in RE2, so `/\S/g` replacing `'#'` over `'𝔘nicode 𝔘'` gives `'######## ##'` in JS and
`'####### #'` in SQL — not fixable by translating the class. Fixed by `withClassGuard` in
`sql-regex-utils.ts` (a pattern containing `.`, `\s`, `\S` or `[^` emits `CASE WHEN regexp_matches(x,
'<the 21 divergent characters, plus astral>') THEN udf(x) ELSE regexp_replace(...) END` with
`needs_udf_fallback`), plus `hasPortableEscapes`, which rejects `\p{...}`/`\P{...}`/`\u{...}` — property
escapes to RE2 always, but to JS **only under the `u` flag**, without which `/\p{L}/` silently matches
the literal text `p{L}`. `extract` DECLINES those patterns instead, having no UDF to fall back to under
`global: true` (DF4).

**Why it slipped is the reusable part:** the Keyword battery already held NBSP, an ideographic space, a
tab and astral pairs, so the gate would have caught this the moment a `\s` or `.` pattern was in
`replaceRegex`'s argument list — and none was. **A guard is only as good as the argument set that
exercises it**, so every arg list should carry one input per branch of its own `applies`, and the
`declines` field now exists so a refusal is asserted rather than assumed. Probe:
`docs/tools/probe/re2-vs-js-regex.mjs`.

## DEF-BIGINT. `bigIntToJSON` subtracts 1, and it has no matching `+1` on this path

**Tracked as [terascope/teraslice#4555](https://github.com/terascope/teraslice/issues/4555).**

**Found 2026-09-22, tracing a claim I had written and could not justify.** DF11 already noted the
`- BigInt(1)` line as "its own question"; this is the answer, and it is worse than a curiosity.

`core-utils/src/numbers.ts` carries a COMPENSATING PAIR, each with a comment admitting nobody knew
the cause:

```ts
// toBigInt:      "for some reason the number is incorrect when given a
//                 number greater than the max safe integer"
if (big > _maxBigInt) return big + BigInt(1);

// bigIntToJSON:  "for some reason bigints ending being +1"
return (int - BigInt(1)).toString(10);
```

The real cause of the original symptom is that `BigInt(someNumber)` is fed a **double that has
already lost precision** — `BigInt(Number('9007199254740993'))` is `9007199254740992n`. The `+1`
patches that one observed value and corrupts every exact input; the `-1` exists only to undo the
`+1`. **The pair cancels only for a value that passed through BOTH.**

Measured, for the input `'9007199254740993'`:

| path | reports | |
|---|---|---|
| `DataFrame.toJSON()` | `9007199254740993` | correct |
| `DataFrame.rows()` | `9007199254740994` | **wrong, +1** |
| what DuckDB stores | `9007199254740993` | correct |
| **`TealFrame.rows()`** | **`9007199254740992`** | **wrong, −1** |
| `TealFrame.ndjson()` | `9007199254740993` | correct — `export-json.ts` renders in SQL |

**Two different wrong answers for one input, and `rows()` disagrees with `ndjson()` inside a single
frame.** No parity argument covers that, and `rows()` is the path the QPL engine uses to build a
response. A value read out of DuckDB never went through `toBigInt`, so it takes the `-1` alone;
`duck-values.ts` already strips the `+1` on the way IN, which is why storage is right and only
output is wrong.

**The fix is to delete both hacks** and convert from the string form rather than via a double.
That changes `DataFrame.rows()` (today +1) as well, so it is a `core-utils` decision with a blast
radius — `json.ts`, `strings.ts`, `dates.ts`, `column/aggregations.ts`, `data-frame/metadata-utils.ts`
— and `duck-values.ts`' local `-1` compensation must come out in the same change.

**Also broken for NEGATIVES, and worse.** The bound is a SIGNED comparison (`int <= _maxBigInt`), so
every negative value takes the `Number.parseInt` branch with no string fallback:
`-9223372036854775808` comes back as `-9223372036854776000` — off by 192, not by 1.

**There is deliberately no test pinning the broken behaviour.** One was written and removed: a test
asserting `rows()` returns `...992` would make the bug a contract, and the next person would have to
argue with a green suite to fix it.

### Status: teal-frame works around it; `core-utils` is a separate ticket

`plain-values.ts` converts bigints itself (`bigIntToPlain`) instead of calling `bigIntToJSON`, using
`export-json.ts`' rule — `abs(value) > 9007199254740991` becomes an exact decimal string, anything
smaller becomes a number. **So `rows()` and `ndjson()` now agree by construction**, which is the
invariant the test pins, and it covers BIGINT min/max and both signs. `toString(10)` on a bigint is
exact at any size; no arithmetic is applied.

`DataFrame` is deliberately NOT changed here — its `rows()` is still one too high — because that fix
belongs with the `core-utils` fix and has a blast radius across every package that depends on it.

<a name="df11"></a>
### DF11. `toJSON` cannot run as a UDF on an integer column — `bigIntToJSON` returns a NUMBER — FIXED 2026-10-07

**FIXED 2026-10-07 on the TealFrame side** by result coercion (see DF2): the number is coerced into the
declared String, as `DataFrame`'s Builder does. The `core-utils` oddity (`bigIntToJSON` returning a
number, and its `-1`) is still worth a ticket, but no longer breaks a query.

**For a `core-utils` ticket, and it blocks a promotion.** `toJSON`'s `output_type` declares the result a
`String` unconditionally, but the implementation routes `isBigInt` input to `bigIntToJSON`
(`core-utils/src/numbers.ts`), which returns a **number** up to `Number.MAX_SAFE_INTEGER` — so on an
`Integer` or `Long` column the UDF promises a VARCHAR, hands back a number, and the query dies with
`Invalid Input Error: A string was expected`.

```ts
if (int <= _maxBigInt) return Number.parseInt(int.toString(10), 10);
return (int - BigInt(1)).toString(10);   // and note the -1, which is its own question
```

Both column types failing is also the evidence that the node binding passes integer columns to a scalar
function as `BigInt` rather than as a JS number, since `isBigInt` is `toJSON`'s only non-string branch.
Put the `int - BigInt(1)` line in the same ticket: its comment reads "for some reason bigints ending
being +1", and it subtracts one from every value above `MAX_SAFE_INTEGER`.

`to_json` renders an integer exactly as `JSON.stringify` does (measured alongside VARCHAR, BOOLEAN,
non-integral DOUBLE, STRUCT and LIST in `docs/tools/probe/remaining-26.mjs`), so an emission would make
these columns work — it is deliberately **withheld** because there is no working UDF for the gate to
prove parity against, and turning a dying query into a silently succeeding one is a decision to take in
the open (`JSON_SQL_TYPES` records that next to the type list).

<a name="df12"></a>
### DF12. A LEADING U+FEFF is stripped on the TealFrame ingest path; `DataFrame` preserves it

Measured 2026-08-26 against the built `dist`; it is the "U+FEFF cannot round-trip" trap in
`sql-emission.md`, which used to cite a non-existent DF3.

```js
const cfg  = { version: 1, fields: { s: { type: 'Keyword' } } };
const recs = [{ s: '﻿abc' }, { s: 'a﻿b' }, { s: 'abc' }];

DataFrame.fromJSON(cfg, recs)    ->  ['<BOM>abc', 'a<BOM>b', 'abc']   // both preserved
TealFrame.fromRecords(cfg, recs) ->  ['abc',      'a<BOM>b', 'abc']   // LEADING one gone
```

**Only a LEADING U+FEFF is affected**, so this is a byte-order-mark strip at the start of a string value,
not "DuckDB drops the BOM". **Recorded as a divergence rather than fixed** — such a value is close to
always an artifact of bad upstream decoding and the TealFrame behaviour is arguably better, so pin it in
a parity test rather than changing one engine to match the other without a decision. It is an
ingest-path difference, not an emission one; a function that *returns* a leading U+FEFF would hit the
same strip through a UDF result, but none promoted so far does.

<a name="df13"></a>
### DF13. Over TLS with a private CA, every `rows()` fails while `size()` succeeds — `ca_cert_file` is CONNECTION-scoped

> **CORRECTION, 2026-09-10 — A CA FILE IS NOT REQUIRED AT ALL.** Everything below is accurate about
> `ca_cert_file`'s scoping and still matters when you choose to supply a PEM, but the premise that a
> private-CA endpoint *needs* one is wrong: DuckDB 1.5.5 exposes
> `enable_curl_server_cert_verification`, and setting it false connects with no PEM. **Do not design
> around a CA certificate** — check `duckdb_settings()` before treating a default as a constraint.

Found 2026-08-27 against minio serving HTTPS with a private CA (a stand-in for Ceph RGW) using the
`s3-perf` harness. **The symptom is misleading** — it looks like a credentials problem specific to
streaming, but the split is exactly "does this operation open a NEW connection", and `TealFrame.rows()`
and `append()` each take their own by design.

| operation | result |
|---|---|
| `size()`, `select([...]) + size()`, `distinct() + size()` | **OK** |
| `limit(100).rows()`, `orderBy(...).limit(100).rows()`, `rows()` (full drain) | **FAILS** — `IO Error: SSL peer certificate or SSH remote key was not OK` |

| setting | scope | survives a new connection? |
|---|---|---|
| `CREATE SECRET` (the S3 credentials) | **instance** | **yes** |
| `SET ca_cert_file` | **connection** | **no** — a new connection sees `""` |

Verified directly: `SELECT current_setting('ca_cert_file')` on a second connection returns `""` after a
plain `SET`, and the query that succeeds on connection 1 fails on connection 2. Both fixes verified:

```sql
SET GLOBAL ca_cert_file = '/path/ca.pem'                        -- new connections inherit it
```
```js
DuckDBInstance.create(path, { ca_cert_file: '/path/ca.pem' })   // or at instance creation
```

**Why it is a data-mate defect and not just a harness bug:** `configureDuckDatabase` accepts only
`{ database, tempDirectory, maxTempDirectorySize, memoryLimit, threads }` and **has no way to express
any S3 or TLS setting** (still true 2026-09-15), so a caller must reach through `frame.query()` and
independently know that `ca_cert_file` needs `SET GLOBAL` while `CREATE SECRET` does not. Suggested fix:
extend `configureDuckDatabase` to carry the remote-storage settings and apply them with `SET GLOBAL`, or
as create-time instance options — plain HTTP and public TLS endpoints chaining to the system CA store
are unaffected, which is why local minio over plain HTTP never showed it.

---

<a name="df14"></a>
### DF14. Every `Long` past 2^53 changed value on the Parquet wire — FIXED 2026-09-28

**Found 2026-09-28** by the first end-to-end probe of typed objects (`docs/tools/probe/typed-objects.mjs`,
`long-over-parquet.mjs`). `Long.toDuckDB()` was `HUGEINT`, and **Parquet has no 128-bit integer, so DuckDB
writes a HUGEINT column as a DOUBLE** — silently. In memory every value was exact; after `writeParquet` →
`fromParquet` (the producer → worker path) it was not:

| in | after the wire |
|---|---|
| `9007199254740993` | `9007199254740992` |
| `9223372036854775807` | `9223372036854775808` — no longer fits in 64 bits |
| `-9223372036854775808` | `-9.223372036854776e18` |

Top-level and nested (`STRUCT(n HUGEINT)`) alike. `docs/tools/probe/wide-int-parquet.mjs` measured every
candidate: `HUGEINT` and `UHUGEINT` → DOUBLE; `DECIMAL(38,0)` exact but capped at 10^38 − 1; `BIGNUM` exact
on the wire but its `*`, `//`, `/`, `%` and `abs` silently return DOUBLE (`bignum-arith.mjs`) — so it trades a
wrong wire for wrong arithmetic. **`BIGINT` → Parquet INT64 is exact.**

**The fix:** a stored `Long` is a `BIGINT` — exactly an Elasticsearch `long`, which is where one comes from.
A value outside the signed 64-bit range is a coercion failure at ingest (strict throws, lenient nulls the
field value), never a wrong number. A **computed** `Long` can be wider — `ipToInt` on IPv6 is 128 bits — and
keeps a wide type inside the query (UDF results are converted with `wideIntegers`); `writeParquet` finds any
128-bit integer by walking DuckDB's type OBJECTS and casts that column to its DECLARED type, so one that fits
is written exactly as INT64, one that does not fails the write loudly, and an undeclared one is refused.
**Not a text substitution on `DESCRIBE`'s output** — the first version did that, and review found DuckDB
does not quote struct member names there, so a member NAMED `HUGEINT` was renamed and silently nulled.

A consequence found by the suite: `export-json.ts` tested `abs(x) > MAX_SAFE`, and `abs` of the int64 minimum
overflows a BIGINT — it is now two comparisons.

<a name="df15"></a>
### DF15. A `Long` given as a JS bigint past 2^53 was stored one too low — FIXED 2026-09-28

DEF-BIGINT's `+1`/`-1` pair (below) cancels only for a value that took BOTH. `toBigIntOrThrow` adds 1 to a
value it PARSES and returns a bigint input untouched, but `duck-values.ts` subtracted 1 from every value past
the bound — so `9007199254740993n` was stored as `...992` and `9223372036854775807n` as `...806`, while the
same values as strings were exact (`docs/tools/probe/long-input-forms.mjs`).

**The fix is on the TealFrame side only**, because `core-utils` is shared with `DataFrame`, which is frozen:
`makeBigIntInputNormaliser` hands a bigint past the bound to coercion as its decimal string, walking the
config so only `Long` positions — nested objects, tuples and arrays included — are touched. Coercion itself
is unchanged.

**TealFrame and DataFrame now DIVERGE here, deliberately.** `DataFrame` still writes `...992` for a bigint
input of `...993`; `export-json-spec.ts` used to assert that value "to match DataFrame", which pinned the
defect as a contract. Its parity fixture now feeds the value as a string (both engines exact), and a separate
test asserts TealFrame's exact output beside DataFrame's wrong one.

<a name="df16"></a>
### DF16. A `GeoJSON` field was stored as JSON text — FIXED 2026-09-28

**Our own choice, not a constraint.** `GeoJSON.toDuckDB()` returned `JSON` from the commit that introduced
`toDuckDB()` (`2a22b653f76`, 2026-08-14, this branch), with the reason "JSON until the spatial extension
earns its place". Everything after was built on it and paid for it: ingest `JSON.stringify`d each shape,
every geo emission and every translator geo query ran `ST_GeomFromGeoJSON(col::VARCHAR)` — a full parse of
every row, on every query — and the DF7 plan would have added a `JSON.parse` to the UDF path.

**Now a `GEOMETRY`.** The node binding cannot create a GEOMETRY *value* (`createValue` throws "not yet
supported"; DuckDB's C API has no geometry constructor), but its **vector** writer can — and ingest writes
vectors. So `src/teal-frame/wkb.ts` encodes GeoJSON to WKB, proved byte-for-byte against DuckDB's own
`ST_AsWKB` (`wkb-spec.ts`), and decodes it again for `rows()`. `ndjson()` renders with `ST_AsGeoJSON`.
`writeParquet` passes `GEOPARQUET_VERSION 'BOTH'`: the GeoParquet 1.0 default types only a TOP-LEVEL
geometry, so a `GeoJSON` array or an object's `GeoJSON` member came back as `BLOB`, and `BLOB -> GEOMETRY`
has no cast (`docs/tools/probe/geometry-list-parquet.mjs`).

**What a GEOMETRY does not keep** — pinned in `geojson-geometry-spec.ts`, and deliberate:

| input | `DataFrame` | `TealFrame` |
|---|---|---|
| `{ type: 'POLYGON', ... }` (non-canonical spelling) | keeps `'POLYGON'` | `'Polygon'` |
| extra keys (`bbox`, `properties`) | keeps them | geometry only |
| an integral coordinate `1` | `1` | `1.0` — the same number (accepted) |
| a 3D position | stored | **rejected** at ingest (a `GeoShape` is 2D) |

The first row flips three geo predicates on exactly one battery input — `{ type: 'POINT' }`, which JS
calls not-a-point and not-disjoint while calling the identical `'Point'` both — recorded as
`knownDivergences` in `sql-emission-spec.ts` (`docs/tools/probe/point-spelling.mjs`).

**Why not `VARIANT` for `Any` / untyped objects, which are still JSON text** — measured 2026-09-28,
`docs/tools/probe/variant-cost.mjs`, 100k-1M rows, queries on the Parquet file: VARIANT is **~9x slower on
every query** (filter, group-by, render: 220 ms vs 25 ms at 100k), **~3.5x slower to produce**, and has **no
break-even** — it costs more at ingest AND per query. Its only gain is 3.1x smaller Parquet. It also
**sorts object keys alphabetically** on output (5 of 12 cases not byte-equal), needs
`storage_compatibility_version 'v1.5.0'`, and **cannot be written from node at all**: `setItem` throws and a
data chunk with a VARIANT column segfaults even when every value is null (`variant-chunk-nulls.mjs`). JSON
text stays for `Any` — which, unlike a shape, has no structure to parse ahead of time.

<a name="df17"></a>
### DF17. A `Tuple` was output as an object, not an array — FIXED 2026-09-29

A `Tuple` is stored as `STRUCT("0" ..., "1" ...)` — a DuckDB LIST cannot hold positions of different
types — and both output paths handed the struct back as it was: `{"0":1.5,"1":"a"}` where `DataFrame` writes
`[1.5,"a"]`. Every Tuple, single or in an array, in `rows()` and in both `ndjson()` modes
(`docs/tools/probe/object-output-parity.mjs`).

- **`ndjson()`**: `export-json.ts` renders a Tuple as `json_array(...)` of its positions in position order,
  each through the same corrections as any field (a big Long becomes a string, a Date ISO-8601). A missing
  position stays `null` INSIDE the array in both modes — merge-patch replaces an array whole — which is
  `DataFrame`'s behaviour too (`[2,null]` with null fields removed).
- **`rows()`**: `toPlainValue` cannot tell a Tuple's struct from an Object's without the config, so
  `row-shape.ts` builds a per-column shaper from it — only for columns with a Tuple somewhere inside, so
  every other column costs nothing per row.

**Not a defect, recorded because it was once reported as one:** `@preserveNullFields` output is correct for
objects. `typed-objects.mjs` passed `DataFrame`'s `toJSON` options to `TealFrame.ndjson()`, which takes
`{ removeNullFields }`, so its "preserve" runs were the default and "found" nulls missing.

<a name="df18"></a>
### DF18. JSON output followed one flag, not `DataFrame`'s `SerializeOptions` — FIXED 2026-09-29

`DataFrame.toJSON` / `rows(true, options)` take seven flags — `useNullForUndefined`, `skipNilValues`,
`skipEmptyArrays`, `skipNilListValues`, `skipNilObjectValues`, `skipEmptyObjects`, `skipDuplicateObjects`
(`src/vector/interfaces.ts`). spaces sets two combinations of them from `remove_null_fields`
(`qpl-engine/src/v3/execute/run.ts:174`). TealFrame took only that flag and approximated the default with
`json_merge_patch('{}', ...)`, which strips EVERY null key recursively. So in the default preset
(`docs/tools/probe/object-output-parity.mjs`, `dataframe-nonfinite.mjs`):

| | `DataFrame` | TealFrame before |
|---|---|---|
| an object left with no non-nil field | field omitted (`skipEmptyObjects`) | `"obj":{}` |
| a nil field inside an element of an ARRAY of objects | omitted | `"qty":null` — merge-patch does not enter arrays |
| a `NaN` / `Infinity` | `"d":null` — NOT nil, `FloatVector` has no `toJSONCompatibleValue` | key removed |
| an undeclared object `{"a":null}` | copied verbatim | the null stripped |

(`@preserveNullFields` was already right for objects; that "bug" was a probe that passed the wrong options.)

**The renderer now implements the seven rules** where `DataFrame` does (`export-json.ts`, `Renderer`):
each value renders to JSON text or to SQL NULL for nil; a member is `'"k":' || v`, which `||` makes NULL
exactly when `v` is nil, so `concat_ws` includes or omits it in ONE evaluation. `ndjson`, `writeNDJSON` and
`rows(options)` take `SerializeOptions`; `removeNullFields` stays as the shorthand for spaces' presets, and
no options at all means spaces' default. `rows(options)` parses the same lines, so it cannot disagree.
Row-level `skipDuplicateObjects` is done on the stream in order, as `rowsWithoutDuplicates` does.

**Performance, measured** (`docs/tools/probe/ndjson-export-cost.mjs`, 1M rows, 16 fields, writeNDJSON):

| | before | first cut | final |
|---|---|---|---|
| default | 307 ms | 614 ms | **229 ms** |
| `@preserveNullFields` | 211 ms | 472 ms | **201 ms** |

Two causes of the first cut's 2x, both removed: testing `v IS NOT NULL` before `'"k":' || v` rendered each
value twice, compounding with nesting; and `WHERE json IS NOT NULL` on the rendered row made DuckDB inline
the alias and render every row twice (`json-render-parts.mjs` showed the renderer itself was FASTER than
the old one). Dropped rows are now decided from the columns' NULL structure (`buildJsonRowFilter`), and only
under `skipEmptyObjects`.

**Field order:** there is no ordering option. `ndjson` and `rows(options)` follow config order, as
`DataFrame` does; `rows()` with no options follows the STRUCT's member order, which `data-types` now emits
in config order too (a STRUCT cast maps members by name, so older payloads still load). Free per row.

**The engine's other two output paths, added 2026-09-30** (`engine-output-spec.ts`):

- `serializeObject` streams a one-row frame's `results` list with `ListVector.getRowIterator(0, true,
  options)` -> **`TealFrame.listValues(column, options)`**, same rules per element, a nil one yielded as
  `null`/`undefined` or skipped as `DataFrame` does; `skipDuplicateObjects` refused with its message.
  Compared across all 64 combinations it accepts, on three one-row shapes, for an object and a scalar list.
- `finish-scope` calls `removeEmptyRows()` / `countEmptyRows()` for its metric ->
  **`TealFrame.removeEmptyRows()`** (a relation, order kept) and **`countEmptyRows()`**. Empty means EVERY
  column's stored value is nil (`isEmptyRow` -> `vector.has`): `{}` and `[]` are values.
- The metadata half of `serializeObject` is `getRow(0, true, options)`, which is the first row of
  `rows(options)` on the frame without `results`.

**Not reproduced, deliberately:** under `skipEmptyArrays`, `TupleVector` treats a position as nil unless
its vector has `toJSONCompatibleValue`, so it drops `[1.5, "a"]` as empty. TealFrame drops a tuple only
when every position is nil. No spaces preset sets `skipEmptyArrays`.

<a name="df19"></a>
### DF19. Doubles past 1e21, and integral doubles past 2^53, rendered differently — FIXED 2026-09-30

Measured across both ends of the exponential range (`docs/tools/probe/double-exponent-format.mjs`):
DuckDB's `to_json` prints the same SHORTEST round-trip digits as `JSON.stringify` everywhere, and differs in
text only in two ways — it writes `1e21` for `1e+21`, and `5.0` for `5`. Small magnitudes (`1e-7`,
`5e-324`) already agreed.

- **The exponent sign** was a pinned divergence while rows were JSON-typed (the JSON type re-normalises
  every number). Rows are text since DF18, so `replace(t, 'e', 'e+')` above `1e21` fixes it.
- **Found while doing so, and worse:** the integral branch cast through `HUGEINT`, which prints a double's
  EXACT binary value. Below 2^53 that equals the shortest form; between 2^53 and 1e21 it does not — the
  double `JSON.stringify` writes as `99999999999999980000` came out as `99999999999999991611392`. Now the
  integral branch strips `.0` from DuckDB's own shortest rendering, and `-0` is written as `0`.

Byte-equal to `DataFrame` for 17 values across both ranges, scalar and in an array. Export cost unchanged
within noise (`ndjson-export-cost.mjs`: 238 / 207 ms against 229 / 201).

### DF20. `rows()` returned `Any` and untyped `Object` columns as their JSON TEXT — FIXED 2026-10-07

`{x: 1}` came out of `rows()` as `'{"x":1}'`, `5` as `'5'`, and `'str'` as `'"str"'`. `ndjson()` was right
all along (DuckDB splices a JSON value in unquoted), and so was `DataFrame`; only the row-object path,
which the QPL engine hands straight to the response, was wrong. **The type sweep passed it**, because it
asserted only that the value was non-null and PLAIN - and a string is both. Found by running
`parseJSON` as a UDF for the first time (DF7).

Fixed in `row-shape.ts`: a JSON column (`isJSONColumn` - `Any`, or an Object/Tuple with no declared
children) gets a shaper that parses the text, at any depth. `type-sweep-spec.ts` now requires every
type, scalar and array, to EQUAL what `DataFrame` yields; `Any` was the only one that failed.

### DF21. `cast` changed the field's type but not its values — FIXED 2026-10-07

`cast` is `ProcessMode.NONE`, and `tealFrameAdapter` returned the column untouched for it - so a cast to
`Integer` left `'21.223'` in a column whose config now said Integer, a cast to an array left a scalar,
and a cast to `IP` never validated. `DataFrame` runs NONE as `copyVectorToBuilder`, copying each value
into a Builder for the NEW config, and the Builder coerces.

Fixed by `adaptTypeChange`: where the type, array-ness or children change, a UDF runs the SAME
`coerceToType` the Builder and `fromRecords` use; where only metadata changes (`description`,
`locale`...) the column is still copied with no UDF. Pinned against `DataFrame` for Integer, Integer[],
Number and an Object with typed children in `udf-types-spec.ts`. Needed DF7 first, since `cast` to or
from an Object, Any or GeoPoint has a STRUCT or JSON on one side.

