# data-mate known defects — `DataFrame` (D1–D6) and `DuckFrame` (DF1–DF13)

> **THERE IS NO DF3.** The number was skipped when these were first written up, and `sql-emission.md`
> once cited "known-defects DF3" for the leading-U+FEFF round trip, which had no entry anywhere — that
> finding is now **DF12**. The DuckFrame set is **DF1, DF2, DF4–DF13**: twelve entries.

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
| [DF12](#df12) | a leading U+FEFF is stripped on DuckFrame ingest; `DataFrame` keeps it | divergence, pinned |
| [DF13](#df13) | over TLS with a private CA every `rows()` fails while `size()` succeeds | open |

Tests live with the feature they cover, not in the deleted `known-defects-spec.ts`. Full DuckDB
behavioural comparison: [`duckdb-parity.md`](./duckdb-parity.md).

| defect | tests |
|---|---|
| D1, D2 (frame level) | `test/data-frame-spec.ts` → `->orderBy` |
| D2 (the comparator) | `test/vector/vector-spec.ts` → `->compare` |
| D3 | `test/function-configs/string/reverse-spec.ts` |
| D4 | `packages/core-utils/test/numbers-spec.ts` (root cause), `test/type-coercion-spec.ts` (boundary) |
| D5 | `test/type-coercion-spec.ts`, commented out at the foot — they assert the **correct** behaviour, so they fail today, and a permanently red suite trains people to ignore it |
| DF1–DF13 | `test/duck-frame/sql-emission-spec.ts` — the SQL-vs-UDF parity gate that found most of them |
| **DEF-BIGINT** | **`core-utils` UNFIXED ([#4555](https://github.com/terascope/teraslice/issues/4555)). duck-frame works around it locally — `test/duck-frame/duck-frame-spec.ts` → 'should read large integers back exactly, and agree with ndjson'** |

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

## `DuckFrame`

Found mostly by `test/duck-frame/sql-emission-spec.ts`, which runs a function through the adapter twice
— as SQL and as its own UDF — and requires the two to agree. None is caused by the emissions; the gate
simply exercised paths nothing else did.

<a name="df1"></a>
### DF1. A FIELD_VALIDATION on an ARRAY column cannot be expressed at all

`duckFrameAdapter` maps per element under `INDIVIDUAL_VALUES`, so the predicate becomes a `BOOLEAN[]`
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
### DF2. `ceil`/`floor`/`round` return a wrapped BIGINT as a STRING past their output type

`output_type` is `Integer`; given `1e21` the UDF path produced `"3875820019684212735"` (a wrapped BIGINT
rendered as a string) and `-3875820019684212700` for `-1e21`, where the plain SQL expression returns the
correct `1e+21` — `Math.ceil(1e21)` is `1e21`, so the JS is right and the conversion into the declared
output type is where it is lost. `-0` is a smaller second divergence (SQL preserves it, the UDF
normalises it to `0`).

This blocks promoting the three; establish what `DataFrame` returns at `1e21` first, since that decides
whether the fix is in the converter or in the declared `output_type`. The emissions currently guard with
`withinIntegerRange` and keep the UDF above it.

<a name="df4"></a>
### DF4. A `FULL_VALUES` function on an ARRAY column cannot be registered as a UDF

`registerScalarFunction` takes `parameter: FieldType`, a bare scalar type with no list form, so
`duckFrameAdapter` registers `dm_addvalues(DOUBLE)` for a `DOUBLE[]` column and the query fails to bind.
That is every `*Values` reducer — `addValues`, `subtractValues`, `multiplyValues`, `divideValues`,
`maxValues`, `minValues` — so **they have never worked on the DuckFrame UDF path at all**.

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
### DF5. `setDefault`'s `output_type` is always `Keyword`, whatever the input was

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
### DF7. No geo function can run as a UDF — JSON and STRUCT types have no parameter mapping

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

<a name="df8"></a>
### DF8. `geo-utils` reports a shape as NOT contained when it merely TOUCHES a hole — TICKET

**For the turf/geo-utils ticket.** Measured on `@turf/*` **7.4.0** (the repo's `package.json` said
`~7.4.0` while `node_modules` held 7.3.5 until `pnpm install` was run); the SQL emissions use `ST_*`,
which is geometrically correct, so these are the inputs where DuckFrame deliberately differs.

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
| **`DuckFrame.rows()`** | **`9007199254740992`** | **wrong, −1** |
| `DuckFrame.ndjson()` | `9007199254740993` | correct — `export-json.ts` renders in SQL |

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

### Status: duck-frame works around it; `core-utils` is a separate ticket

`plain-values.ts` converts bigints itself (`bigIntToPlain`) instead of calling `bigIntToJSON`, using
`export-json.ts`' rule — `abs(value) > 9007199254740991` becomes an exact decimal string, anything
smaller becomes a number. **So `rows()` and `ndjson()` now agree by construction**, which is the
invariant the test pins, and it covers BIGINT min/max and both signs. `toString(10)` on a bigint is
exact at any size; no arithmetic is applied.

`DataFrame` is deliberately NOT changed here — its `rows()` is still one too high — because that fix
belongs with the `core-utils` fix and has a blast radius across every package that depends on it.

<a name="df11"></a>
### DF11. `toJSON` cannot run as a UDF on an integer column — `bigIntToJSON` returns a NUMBER

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
### DF12. A LEADING U+FEFF is stripped on the DuckFrame ingest path; `DataFrame` preserves it

Measured 2026-08-26 against the built `dist`; it is the "U+FEFF cannot round-trip" trap in
`sql-emission.md`, which used to cite a non-existent DF3.

```js
const cfg  = { version: 1, fields: { s: { type: 'Keyword' } } };
const recs = [{ s: '﻿abc' }, { s: 'a﻿b' }, { s: 'abc' }];

DataFrame.fromJSON(cfg, recs)    ->  ['<BOM>abc', 'a<BOM>b', 'abc']   // both preserved
DuckFrame.fromRecords(cfg, recs) ->  ['abc',      'a<BOM>b', 'abc']   // LEADING one gone
```

**Only a LEADING U+FEFF is affected**, so this is a byte-order-mark strip at the start of a string value,
not "DuckDB drops the BOM". **Recorded as a divergence rather than fixed** — such a value is close to
always an artifact of bad upstream decoding and the DuckFrame behaviour is arguably better, so pin it in
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
streaming, but the split is exactly "does this operation open a NEW connection", and `DuckFrame.rows()`
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
