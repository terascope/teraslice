# data-mate `DataFrame` — known defects

Six defects in `DataFrame`. **D1, D2, D3 and D4 are now fixed** (see [below](#fixed)); only D5
remains open.

These were first written up as one `test/known-defects-spec.ts`, which was the right shape for the
report and the wrong shape for the repo: it organised tests by *when the bugs were found* rather than
by *what the code does*, so nobody editing `Vector.compare` would ever look there. **That file is
gone** — each test now lives with the feature it covers:

| defect | tests now live in |
|---|---|
| D1 multi-key ordering | `test/data-frame-spec.ts` → `->orderBy` → `when sorting by more than one key` |
| D2 nil ordering, frame level | `test/data-frame-spec.ts` → `->orderBy` → `when the sorted column contains nils` |
| D2 the comparator itself | `test/vector/vector-spec.ts` → `->compare` |
| D3 grapheme reversal | `test/function-configs/string/reverse-spec.ts` (new) |
| D4 numeric coercion | `packages/core-utils/test/numbers-spec.ts` (root cause) and `test/type-coercion-spec.ts` (boundary) |
| D5 date coercion, **still open** | `test/type-coercion-spec.ts`, commented out at the foot of the file |

D5 is commented out rather than deleted or skipped: it asserts the **correct** behaviour, so it fails
against the implementation as it stands, and a permanently red suite trains people to ignore it.

```
# whole data-mate suite (2026-08-14): 40 suites, 2728 passed, 0 failed
node ../scripts/bin/ts-scripts test ../data-mate

# the numeric coercion root cause
node ../scripts/bin/ts-scripts test ../core-utils -- --testPathPatterns numbers-spec
```

| id | defect | status | severity | blast radius |
|---|---|---|---|---|
| [D1](#d1) | multi-key `orderBy` sums per-field comparisons instead of first-non-zero | **fixed** | high | 76% of multi-key sorts returned wrong order |
| [D2](#d2) | a nil makes the comparator non-transitive, misordering **non-nil** values | **fixed** | high | any sort over a column containing nils |
| [D3](#d3) | `reverse()` splits astral characters into lone surrogates | **fixed** | medium | emoji / non-BMP text corruption |
| [D4](#d4) | integer coercion truncates at the first non-digit | **fixed** | medium | silent wrong values on ingest |
| [D5](#d5) | date coercion delegates to the JS `Date` parser | open | medium | bare integers silently become years |
| [D6](#d6) | an existing test asserted the buggy output as expected | **resolved** | — | blocked fixing D1 |

---

<a name="d1"></a>
## D1 — multi-key `orderBy` sums per-field comparisons

**Source:** `src/vector/Vector.ts:45-51` (`Vector.getSortedIndices`)

```js
original.sort(([, a], [, b]) => (
    sortBy.reduce((acc, { vector, direction: d }, i) => {
        const res = vector.compare(a[i], b[i]);
        return acc + (d === 'asc' ? res : -res);   // <-- summed
    }, 0)
))
```

The per-field comparisons are **added together**. A correct comparator returns the first non-zero
result. When two keys disagree, `-1 + 1 = 0`, the comparator reports "equal", and the sort leaves the
rows in input order — so the primary key is ignored.

**Minimal reproduction**

| | |
|---|---|
| input rows | `[{a:'y', b:2}, {a:'x', b:1}]` |
| call | `.orderBy('a:asc', 'b:desc')` |
| expected | `['x1', 'y2']` — `'x' < 'y'`, so `x1` first regardless of `b` |
| **actual** | **`['y2', 'x1']`** |

Why: `compare('y','x')` is `+1`; `b:desc` inverts `compare(2,1)` to `-1`; the sum is `0`, so the rows
are treated as equal and input order survives.

**Scale of the problem** — fuzzed over 200 random 3-to-14-row frames with a fixed seed (12345):

> **151/200 frames (76%) sorted incorrectly.**

**Tests:** `->orderBy › when sorting by more than one key › should order by the first key when a later key disagrees`,
`D1 › should sort every random frame the same as a reference comparator`

---

<a name="d2"></a>
## D2 — a nil makes the comparator non-transitive

**Source:** `src/vector/Vector.ts:493-500` (`Vector.compare`)

```js
const aVal = this._getComparableValue(a);   // null for any nullish
const bVal = this._getComparableValue(b);
if (aVal < bVal) return -1;
if (aVal > bVal) return 1;
return 0;
```

`_getComparableValue` maps nullish to `null`. For **strings**, `null < 'a'` and `null > 'a'` are *both*
false, so `compare` returns `0` — a nil is "equal" to every string.

That makes the comparator **non-transitive**: `null == 'a'`, `null == 'z'`, but `'a' < 'z'`. A
non-transitive comparator does not merely misplace the nils — `Array.prototype.sort` may return **real
values in the wrong order**.

**Reproduction (mechanism)**

| | |
|---|---|
| `compare(null, 'a')` | `0` |
| `compare(null, 'z')` | `0` |
| `compare('a', 'z')` | `-1` |

**Reproduction (consequence)** — 64 rows, ~25% nils, seed 999:

| | |
|---|---|
| non-nil values, as sorted | `a a a b c c c d …` |
| non-nil values, correct | `a a a a b b c c …` |

The first non-nil value is out of order at **index 3**. Rate rises with array size as V8 switches sort
strategy: n=8 → 43%, n=32 → 96%, **n≥64 → 100%**.

**Sub-case — nils sort as the number zero.** For numerics `null < 5` evaluates as `0 < 5`, so a nil
sorts as `0`. This is invisible when values are all negative (nil lands last) or all positive (nil lands
first). It only shows when the range spans zero:

| | |
|---|---|
| input | `[-10, null, 5, -1, 20]` |
| call | `.orderBy('n:asc')` |
| expected | nil at one end |
| **actual** | **`[-10, -1, undefined, 5, 20]`** — nil at index 2, between two real values |

**Tests:** `Vector › ->compare` (three cases), plus `->orderBy › when the sorted column contains
nils` (two cases)

---

<a name="d3"></a>
## D3 — `reverse()` splits astral characters

**Source:** `src/function-configs/string/reverse.ts` (via `dataFrameAdapter`)

Reversal operates on **UTF-16 code units**. Characters outside the Basic Multilingual Plane (emoji,
many CJK extensions) are stored as surrogate pairs, and reversing the units splits the pair, producing
lone surrogates — which are not valid text and will not round-trip through JSON or a database.

| input | expected | actual |
|---|---|---|
| `"abc"` | `"cba"` | `"cba"` ✅ |
| `"😀x"` | `"x😀"` | **`"x\ude00\ud83d"`** |
| `"a😀b"` | `"b😀a"` | **`"b\ude00\ud83da"`** |
| `"👨x"` | `"x👨"` | **`"x\udc68\ud83d"`** |

**Fixed** in `fix: reverse() must reverse by grapheme, not by UTF-16 code unit`: the string is
segmented with `Intl.Segmenter`, behind a fast path for text that contains nothing needing it.

Code-point reversal (`[...str].reverse().join('')`) is **not** a sufficient fix — it keeps surrogate
pairs intact but detaches combining marks (`'e' + U+0301` lands the accent on a different letter) and
reverses a regional-indicator pair into a *different flag*. Only grapheme segmentation is correct.

**Tests:** `test/function-configs/string/reverse-spec.ts`. The simple cases stay in the config's own
`examples`, which `function-configs-spec` runs for every function; the unicode cases need escapes and
a lone-surrogate check, so they get a spec file — the same split `toGeoPoint` and `parseJSON` use.

---

<a name="d4"></a>
## D4 — integer coercion truncates at the first non-digit

**Source:** `packages/core-utils/src/numbers.ts` (`toIntegerOrThrow`, `toFloatOrThrow`), reached from
data-mate via `src/builder/type-coercion.ts` (`coerceToNumberType`)

The root cause was a **split between the check and the parse**. `isNumberLike` validated the whole
string with `Number()`, but the converters then parsed it with `Number.parseInt` / `Number.parseFloat`
— prefix parsers that stop at the first character they do not understand and return what they read so
far. So a value passed the check as one number and was stored as a different one: a **silently wrong
value**, not a rejection, which is worse than throwing because it propagates.

| input | `Number(input)` | integer, before | integer, after | float, before | float, after |
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

`"1e3"` → `1` was the most dangerous case: scientific notation is common in exported data and the
value was off by three orders of magnitude with no error. `"1,000"` → `1` was the same bug for
separators, which `isNumberLike` explicitly accepts.

**The fix** is to remove the split rather than patch each converter: `_parseNumberLike` is now the one
parse, used by `isNumberLike` to decide *and* by the converters to produce the value. A value that
passes the check therefore always converts to the number it looked like.

### What changed for callers

The set of **accepted** inputs is unchanged — `isNumberLike` is the gate and its logic is identical.
Two things do change:

- Values that were silently wrong are now correct (the bold cells above).
- `"2e21"` and similar now **throw** for integer field types instead of returning `2`. It parses to a
  number too large to be a safe integer, so it is rejected — the same treatment
  `"9007199254740993"` already got. For `Byte` and `Short` this also means a value like `"1e3"` is
  now correctly rejected as out of range instead of stored as `1`.

**Tests:** the `toInteger` / `toFloat` cases in `packages/core-utils/test/numbers-spec.ts` (root
cause), and the `coerceToNumberType` table in `test/type-coercion-spec.ts` (the boundary data-mate
actually calls). One existing expectation, `toInteger(['11e10', 11])`, asserted the defect and now
asserts `110000000000`.

---

<a name="d5"></a>
## D5 — date coercion delegates to the JS `Date` parser

**Source:** `src/builder/type-coercion.ts` (date branch)

Non-ISO input falls through to `new Date(value)`. Two consequences.

### 5a. A bare integer string becomes a **year**

| input | actual | note |
|---|---|---|
| `"0"` | `2000-01-01T00:00:00.000Z` | JS parses bare `"0"` as year 2000 |
| `"1"` | `2001-01-01T00:00:00.000Z` | |
| `"99"` | `1999-01-01T00:00:00.000Z` | |
| `"2024"` | `2024-01-01T00:00:00.000Z` | |

In real data a bare small integer is far more likely to be a count, a flag, or an epoch than a date.
It is accepted silently. Note `"1710028800000"` (epoch ms) *is* handled — so the parser is
inconsistent about which numeric forms it treats as epochs versus years.

### 5b. Locale-shaped formats read the process timezone

`"Mar 10 2024"` and `"03/10/2024"` are parsed by JS `Date`, which uses the **process timezone**. The
same input therefore stores a different instant on differently-configured hosts:

```
TZ=UTC             -> 2024-03-10T00:00:00.000Z
TZ=America/Denver  -> 2024-03-10T07:00:00.000Z
TZ=Asia/Tokyo      -> 2024-03-09T15:00:00.000Z
```

**5b is not covered by a test.** Under jest the VM context caches the timezone at startup, so changing
`process.env.TZ` mid-run has no effect — verified, even `new Date()` ignores it. Reproduce outside jest
with the three commands above against `dist/src/index.js`. Only 5a is asserted, and it shares the same
root cause.

**Tests:** none active — the three cases are commented out at the foot of `test/type-coercion-spec.ts`,
with this write-up. Uncomment them when the behaviour question is settled.

---

<a name="d6"></a>
## D6 — two existing tests assert the buggy output as expected

**Not modified.** Listed because they will fail when D1 and D2 are fixed, and someone will otherwise
lose time assuming the fix is wrong.

All five `->orderBy` tests in `test/data-frame-spec.ts`, checked against a first-non-zero-key reference
with nils last. Fixture: `Jill(39) Billy(47) Frank(20) Nancy(10) Jane(no age)`.

| test | asserted | correct | |
|---|---|---|---|
| `orderBy('name')` | `Billy Frank Jane Jill Nancy` | same | ✅ |
| `orderBy('name:desc')` | `Nancy Jill Jane Frank Billy` | same | ✅ |
| `orderBy('age')` | `Jane(_) Nancy Frank Jill Billy` | `Nancy Frank Jill Billy Jane(_)` | ⚠️ |
| `orderBy('age:desc')` | `Billy Jill Frank Nancy Jane(_)` | same | ✅ |
| **`orderBy(['name:desc','age:desc'])`** at **line 1196** | **`Jill Billy Frank Nancy Jane`** | `Nancy Jill Jane Frank Billy` | ❌ |

**Line 1196 is the unambiguous one** — the asserted result is not sorted by name in *either* direction.
This is D1 snapshotted as correct.

`orderBy('age')` differs only in nil placement, which follows from the nil-as-zero mapping in D2.
Where nils *should* sort is a convention choice; the mechanism producing it is not.

---

<a name="fixed"></a>
## The D1/D2 fix

Both live in `src/vector/Vector.ts` and are independent of D3–D5.

**D1** — `getSortedIndices` now returns the first non-zero comparison instead of summing:

```js
for (let i = 0; i < sortByLen; i++) {
    const { vector, direction } = sortBy[i];
    const res = vector.compare(a[i], b[i]);
    if (res !== 0) return direction === 'asc' ? res : -res;
}
return 0;
```

**D2** — `compare` orders nils explicitly instead of leaving them to the relational operators. **A nil
sorts as the smallest value**, so it is first ascending and last descending:

```js
if (aVal == null || bVal == null) {
    if (aVal == null && bVal == null) return 0;
    return aVal == null ? -1 : 1;
}
```

That convention was chosen because it is what the existing `orderBy('age')` and `orderBy('age:desc')`
tests already asserted, so both continue to pass unchanged.

`DataFrame.orderBy` and `Column.sort` both route through `getSortedIndices`, so one change covers both.

### Test changes

Exactly one existing expectation changed: `test/data-frame-spec.ts` `'should be able to sort name:desc
and age:desc'`, which asserted `Jill, Billy, Frank, Nancy, Jane` — not sorted by name in either
direction. Now asserts `Nancy, Jill, Jane, Frank, Billy`. Every name in the fixture is distinct, so
`name:desc` alone determines the order and `age` never acts as a tie-breaker.

The other four `->orderBy` tests were untouched and still pass.

### Measured cost

Multi-key sorts are **1.7×–2.4× slower**, measured A/B on identical data with only the comparator loop
swapped (200k rows):

| distinct values in first key | old | new | ratio |
|---|---|---|---|
| 2 | 52 ms | 90 ms | 1.73× |
| 8 | 42 ms | 91 ms | 2.18× |
| 1,000 | 41 ms | 91 ms | 2.22× |
| 200,000 | 43 ms | 104 ms | 2.43× |

**This is not comparator overhead — it is the cost of actually sorting.** The old comparator reported
"equal" for 45–53% of pairs, which let TimSort find long already-ordered runs and skip work. Instrumented
over 50k rows it made ~253k comparisons where the correct comparator makes ~714k (2.6–2.8×). The fix
does not make sorting slow; it makes sorting happen.

Single-key sorts are unaffected — the loop exits on the first key either way.

## Notes on the remaining defects

- **D5 is a behaviour change, not a pure fix.** Tightening date coercion will reject input that is
  currently accepted. Worth checking production data before changing it — particularly whether
  anything relies on epoch-as-string dates.
- **D4 turned out not to be a behaviour change** in the way it was first written up: the accepted set
  is unchanged, only the produced values are. The one new rejection is `"2e21"`-style input for
  integer types, which was previously stored as `2`.
- Full behavioural comparison against DuckDB, including these defects in context, is in
  [`duckdb-parity.md`](./duckdb-parity.md).

---

## DuckFrame defects found while building the SQL-vs-UDF dispatch (2026-08-19, DF10-DF11 on 2026-08-21)

Both were found by `test/duck-frame/sql-emission-spec.ts`, which runs a function through the adapter
twice - as SQL and as its own UDF - and requires the two to agree. Neither is caused by the emissions;
the gate simply exercised paths nothing else did.

### DF1. A FIELD_VALIDATION on an ARRAY column cannot be expressed at all

`duckFrameAdapter` maps per element under `INDIVIDUAL_VALUES`, so a validation's predicate becomes a
`BOOLEAN[]`, and the `CASE WHEN <pred> THEN col ELSE NULL END` wrapper around it then fails:

```
Conversion Error: Unimplemented type for cast (BOOLEAN[] -> BOOLEAN)
LINE 1: SELECT * FROM (SELECT CASE WHEN list_transform("field", lambda x : contains(x, 'e')) THEN…
```

**It is not specific to SQL emission** - the UDF path builds the identical shape, so
`@contains` on any array field is broken today on both paths. What the right answer is has to come
from `DataFrame`: does a failing element become null (per-element nulling,
`list_transform(col, lambda x : CASE WHEN pred(x) THEN x ELSE NULL END)`) or does the whole value
become null (`CASE WHEN list_reduce(list_transform(...), lambda a, b : a AND b) THEN col ELSE NULL END`)?
Check `validateColumnData` and the JS adapter's `_mapValue` before choosing.

The parity gate skips the array case for validations, and says so, rather than asserting a shape that
is wrong on both sides.

### DF2. `ceil`/`floor`/`round` return a wrapped BIGINT as a STRING past their output type

Their `output_type` is `Integer`. Given `1e21`, the UDF path produced `"3875820019684212735"` - a
wrapped BIGINT, rendered as a string - and `-3875820019684212700` for `-1e21`, where the plain SQL
expression returns the mathematically correct `1e+21`. `Math.ceil(1e21)` is `1e21`, so the JavaScript
implementation is right and the conversion into the declared output type is where it is lost.

`-0` is a second, smaller divergence: the SQL expression preserves it, the UDF path normalises it to
`0`.

**This is what blocks promoting those three functions**, since promotion would change the answer
(for the better, which is still a change). Establish what `DataFrame` returns at `1e21` first; that
decides whether the fix is in the converter or in the declared `output_type`.

> **THERE IS NO DF3.** The number was skipped when these were first written up, and
> `sql-emission.md` cited "known-defects DF3" for the leading-U+FEFF round trip, which had no entry
> anywhere. That finding is now written up properly as **DF12**, at the end of this section.
> `HANDOFF.md` used to say "eleven defects (DF1-DF11)"; the real count is ten, now eleven with DF12.

### DF4. A `FULL_VALUES` function on an ARRAY column cannot be registered as a UDF

`registerScalarFunction` takes `parameter: FieldType` — a bare scalar type, with no list form. For a
`FULL_VALUES` function the UDF has to receive the WHOLE array, so `duckFrameAdapter` registers
`dm_addvalues(DOUBLE)` for a `DOUBLE[]` column and the query fails to bind:

```
Binder Error: No function matches the given name and argument types 'dm_addvalues_ebqori(DOUBLE[])'.
Candidate functions:
	dm_addvalues_ebqori(DOUBLE) -> DOUBLE
```

That is every `*Values` reducer — `addValues`, `subtractValues`, `multiplyValues`, `divideValues`,
`maxValues`, `minValues` — and it means **they have never worked on the DuckFrame UDF path at all**.
It predates the SQL emissions; `scalarResultConfig` drops `array` for the RESULT, which is right
under `INDIVIDUAL_VALUES`, but nothing ever built a LIST parameter type or an input converter for
one.

The six now run as SQL (`list_sum`, `list_product`, `list_max`, `list_min`, and a `list_reduce` fold
for the two that are order-dependent), so the working path exists. The gate proves their parity
against `config.create()` called **directly in JavaScript** rather than against the UDF, because
there is no UDF to compare with — see `arrayOnly` in `sql-emission-spec.ts`.

Fixing the UDF layer is only needed if some other `FULL_VALUES` function has to stay a UDF. It would
mean a list parameter type in `scalar-function.ts` plus an input converter that unwraps a list
vector. Not attempted.

### DF5. `setDefault`'s `output_type` is always `Keyword`, whatever the input was

```ts
output_type(inputConfig) {
    return { field_config: { ..., type: FieldType.Keyword } };
}
```

The implementation returns the value unchanged, so on any non-string column the UDF hands a
non-string to a VARCHAR result and DuckDB answers `Invalid Input Error: A string was expected`. It
is broken before any emission exists — `setDefault` on a `Number` column does not work on the
DuckFrame UDF path at all.

The emission therefore claims **a string column with a string default** and nothing else, which is
the one shape where input, output and default agree, and is what the function is for. Widening it
would mean the emission returning a DOUBLE where `output_type` declares a `Keyword` — declaring a
different output type rather than fixing the defect.

The fix is a decision about the config, not about SQL: either `output_type` should preserve the
input type, or the implementation should stringify. `DataFrame`'s behaviour decides which.

### DF6. `addToDate`/`subtractFromDate` give a different answer per SERVER TIMEZONE

`date-fns`' `add`/`sub` operate on LOCAL WALL-CLOCK time, while every other part of the DuckFrame
pipeline treats the value as naive UTC. Measured 2026-08-19 over a 12-argument × 7-date matrix:

| TZ | `addToDate('1900-03-01T00:00:00Z', { months: 1 })` |
|---|---|
| `UTC` | `1900-04-01T00:00:00Z` |
| `Asia/Kolkata` | `1900-04-01T00:00:00Z` |
| `America/New_York` | **`1900-03-29T00:00:00Z`** |

Midnight UTC is the previous day under a negative offset, so the month is added to February
instead of March. The same mechanism affects day and week units across a DST transition:
`+ { days: 1 }` over 2026-03-08 adds 23 hours in New York and 24 in UTC.

Hours, minutes and seconds are exact epoch arithmetic on both sides and never diverge, and
`milliseconds` is silently ignored by both (`date-fns`' `Duration` has no such key).

**Consequence for SQL emission:** the emission claims time units only, and the calendar units keep
the UDF. A UTC-based expression cannot reproduce a timezone-dependent answer, and reproducing one
is not obviously the goal — the same query would answer differently on two workers in different
regions. `getTimeBetween` is NOT affected: its `differenceInDays`/`differenceInWeeks` are
epoch-based despite the names, and only its `calendar*` family is local. Fixing this is a decision
about `core-utils`, not about SQL.

### DF7. No geo function can run as a UDF — JSON and STRUCT types have no parameter mapping

`scalar-function.ts`'s `PARAMETER_TYPES` deliberately maps no DuckDB type object for the JSON and
STRUCT field types, and says so:

```
// - GeoJSON / Any are JSON, and the binding exports no JSON type constant.
// - GeoPoint / Geo / Boundary / Object / Tuple are STRUCTs, which need a type built at
//   runtime rather than a constant.
```

Registering one throws `Field type "GeoJSON" cannot be a scalar function parameter or result yet`.
That is the right call — silently accepting VARCHAR would produce a column whose type contradicts
the DataType config — but the consequence is that **every one of the 15 geo functions is unusable
on the DuckFrame UDF path**, along with anything else taking an `Object`, `Tuple` or `GeoPoint`.

So for these the SQL emission is not an optimisation, it is the only way the function can run. The
four promoted so far (`isGeoJSON`, `isGeoShapePoint`, `isGeoShapePolygon`, `isGeoShapeMultiPolygon`)
are proved against `config.create()` called directly in JavaScript — `noUdfPath` in the gate — for
the same reason `arrayOnly` exists (DF4).

Same family as DF4: both are the UDF layer not covering a type, surfaced by trying to promote a
function that needs it. Fixing it means building DuckDB type objects at runtime in
`scalar-function.ts` rather than looking up constants.

### DF8. `geo-utils` reports a shape as NOT contained when it merely TOUCHES a hole

**For the turf/geo-utils ticket.** Measured on `@turf/*` **7.4.0** (verified installed — the repo's
`package.json` said `~7.4.0` while `node_modules` still held 7.3.5 until `pnpm install` was run).
The SQL emissions now use `ST_*`, which gives the geometrically correct answer, so these are the
inputs where DuckFrame deliberately differs from `DataFrame`.

#### The reproduction

```js
import { geoContains } from '@terascope/geo-utils';

const holed = { type: 'Polygon', coordinates: [
    [[0, 0], [0, 10], [10, 10], [10, 0], [0, 0]],   // shell
    [[4, 4], [4, 6], [6, 6], [6, 4], [4, 4]],       // hole
]};
const square = { type: 'Polygon', coordinates: [[[0, 0], [0, 4], [4, 4], [4, 0], [0, 0]]] };

geoContains(holed, square);   // => false   WRONG
// DuckDB: ST_Contains(holed, square) => true
```

`square` occupies `0..4`; the hole starts at `4`. They meet at the single point `(4,4)`. The
square's interior never enters the hole, so it is contained.

Not caused by the hole existing — only by touching it:

```
holed contains square 0..4      turf=false  sql=true    <-- diverges
holed contains 0..1 and 8..9    turf=true   sql=true     (nowhere near the hole)
sq    contains square 0..4      turf=true   sql=true     (no hole at all)
```

#### The cause, in `packages/geo-utils/src/index.ts`

`geoContainsFP` splits each shape into shell polygons and hole polygons, then tests the hole with
`booleanIntersects`:

```ts
const withinInputHole = inputHoles.some(
    (iHolePoly) => queryPolygons.some((qPoly) => intersect(qPoly, iHolePoly))
);
```

`intersect` is `@turf/boolean-intersects`, which is **boundary-inclusive** — two polygons sharing
only an edge or a corner DO intersect. So "touches the hole" is treated as "is inside the hole",
and the shape is reported not-contained. The fix is presumably an interior-overlap test (area of
intersection > 0, or `booleanOverlap`) rather than `booleanIntersects`.

#### Every affected function and input

| function | input | argument | `geo-utils` | SQL (correct) |
|---|---|---|---|---|
| `geoContains` | shell `0..10` hole `4..6` | square `0..4` | `false` | **`true`** |
| `geoContains` | shell `0..10` hole `4..6` | MultiPolygon `0..4` + `6..10` | `false` | **`true`** |
| `geoWithin` | MultiPolygon `0..4` + `6..10` | shell `0..10` hole `4..6` | `false` | **`true`** |
| `geoRelation` `contains` | shell `0..10` hole `4..6` | square `0..4` | `false` | **`true`** |
| `geoRelation` `within` | square `0..4` | shell `0..10` hole `4..6` | `false` | **`true`** |
| `geoRelation` `contains` | shell `0..10` hole `4..6` | point `(4,5)` on the hole edge | `true` | **`false`** |
| `geoContainsPoint` | shell `0..10` hole `4..6` | point `(4,5)` on the hole edge | `true` | **`false`** |

The last two are the same difference in the other direction: a point exactly on the hole's edge is
on the POLYGON'S BOUNDARY, so `ST_Contains` is false, while `booleanPointInPolygon` defaults to
`ignoreBoundary: false` and calls it inside.

`geoIntersects` and `geoDisjoint` are **unaffected** — identical on all 324 pairs.

#### Separately: `geoPointWithinRange` is not a distance test

```js
geoPointWithinRange({ lat: 0, lon: 0 }, '1000km', pointAtTrueDistance(998_867));  // => false
```

`makeGeoCircle` calls `@turf/circle`, which builds a **64-sided polygon**, and then runs
point-in-polygon against it. The polygon is inscribed, so everything between it and the real circle
is wrongly excluded — a band of about `r · (1 − cos(π/64))`: ~1.2 km at a 1000 km radius, ~120 m at
100 km. The emission uses `ST_Distance_Sphere`, which has no such band.

Probe: `docs/tools/probe/geo-predicates.mjs`.

### DF9. `isBase64` rejects 99.3% of valid base64 — it only accepts base64 of UTF-8 TEXT

**For a `core-utils` ticket.** The SQL emission does NOT reproduce this; it implements RFC 4648,
which is the correct answer, and the gate records each difference. Measured 2026-08-20.

#### The defect

`packages/core-utils/src/strings.ts`:

```ts
export function isBase64(input: unknown): boolean {
    if (!isString(input)) return false;

    const validatorValid = validator.isBase64(input);

    if (validatorValid) {
        const decode = Buffer.from(input, 'base64').toString('utf8');
        const encode = Buffer.from(decode, 'utf8').toString('base64');

        return input === encode;   // <-- lossy
    }

    return false;
}
```

`validator.isBase64` is already a complete and correct check. The round trip added after it decodes
the payload **as UTF-8** — and `toString('utf8')` replaces every byte sequence that is not valid
UTF-8 with U+FFFD, which cannot re-encode to the original. So the function silently requires that
the decoded bytes be UTF-8 text.

**Base64 exists to carry arbitrary binary.** The check therefore fails at its own purpose.

#### The measurement

2,000 random payloads of each kind:

| payload | rejected |
|---|---|
| valid base64 of random 9-byte **binary** | **1,987 / 2,000 = 99.3%** |
| valid base64 of random ASCII **text** | 0 / 2,000 = 0.0% |

Smallest reproductions — all three are valid base64, and `validator` agrees:

```js
isBase64('abcd');   // false  — decodes to 69 b7 1d, not valid UTF-8
isBase64('////');   // false  — decodes to ff ff ff
isBase64('++++');   // false  — decodes to fb ef be
isBase64('AAAA');   // true   — decodes to 00 00 00, which IS valid UTF-8
```

That last line is the tell: whether a base64 string is "valid" currently depends on the *content*
of the bytes it encodes.

#### The correct behaviour, which the SQL implements

RFC 4648 with padding — `validator.isBase64`'s default, and nothing after it:

```sql
x = '' OR (length(x) % 4 = 0 AND regexp_matches(x, '^[A-Za-z0-9+/]+={0,2}$'))
```

The empty string is accepted before the length check, matching `validator`. `'a==='` is still
rejected: three padding characters do not match `={0,2}`.

#### The fix

Delete the round trip. If the intent was "is this base64 of readable text", that is a different
predicate and deserves a different name — the current one is documented as
"Returns the input if it is a valid base64 string".

### DF10. `replaceRegex`'s SQL emission returned different TEXT for `.`, `\s`, `\S` and negated classes

**Found and FIXED on this branch, 2026-08-21.** Not a `core-utils` defect - a defect in the
emission promoted by commit `6427b2e`, which shipped inside this branch and was caught here rather
than in production. Recorded because the REASON it slipped is the reusable part.

#### The defect

`isRe2Safe` decides whether a JavaScript regex may be handed to DuckDB. It rejects lookaround and
backreferences, on the grounds that **RE2 cannot compile them and the query ERRORS** - a dead query
being worse than a slow one. That is true and remains the right test, but it answers a narrower
question than the one being asked: it checks what RE2 can COMPILE, not what RE2 MATCHES.

A pattern both engines compile can still match different characters, and then nothing errors - the
query returns different text. Measured by `docs/tools/probe/re2-vs-js-regex.mjs` over all 28
characters where the definitions could differ:

| construct | verdict |
|---|---|
| `\s` | **diverges on 20 characters.** JavaScript's `\s` is `WhiteSpace` + `LineTerminator`, so it accepts VERTICAL TAB, NBSP, the whole `Zs` category, U+2028, U+2029 and the BOM. RE2's is exactly `[\t\n\f\r ]` |
| `\S` | inverts on the same 20 |
| `.` | **diverges on 3.** JavaScript's `.` excludes CR, U+2028 and U+2029 as well as LF; RE2's excludes only LF |
| `\w`, `\d`, `\b` | **agree on all 28** - both are ASCII-only, so a pattern built from these needs no guard |

Then the parity gate found a second half the probe had not thought to ask about. A construct that
matches "any character" - `.`, `\S`, a negated class - consumes one **UTF-16 code unit** in
JavaScript and one **code point** in RE2, so `/\S/g` replacing `'#'` over `'𝔘nicode 𝔘'` gives
`'######## ##'` in JavaScript and `'####### #'` in SQL. Astral input therefore diverges too, and
translating the character class cannot fix that - it is the unit of matching, not the membership.

#### The fix

A value-level guard, the same shape as `HAS_ASTRAL` on `truncate` and `isLength`: when the pattern
contains `.`, `\s`, `\S` or `[^`, the emission becomes

```
CASE WHEN regexp_matches(x, '<the 21 divergent characters, plus astral>') THEN udf(x)
     ELSE regexp_replace(...) END
```

with `needs_udf_fallback`. Real text takes the native path; a value carrying one of those
characters keeps JavaScript's own classes and code units. `hasPortableEscapes` was added at the same
time and rejects `\p{...}`/`\P{...}` and `\u{...}`, which are Unicode property escapes to RE2 always
and to JavaScript **only under the `u` flag** - without it `/\p{L}/` matches the literal text
`p{L}`, silently.

`extract`, promoted in the same stretch, DECLINES those patterns instead of guarding them: under
`global: true` it has no working UDF to fall back to (DF4), so its emission has to be
self-sufficient or absent. That costs `he.*` a native path and buys never returning a different
answer.

#### Why it slipped

The Keyword battery already held NBSP, an ideographic space, a tab and astral pairs - the gate would
have caught this the moment a `\s` or `.` pattern was in `replaceRegex`'s argument list, and none
was. **A guard is only as good as the argument set that exercises it.** Every arg list should
contain one input per branch of its own `applies`, and the `declines` field now exists so a refusal
is asserted rather than assumed.

### DF11. `toJSON` cannot run as a UDF on an integer column — `bigIntToJSON` returns a NUMBER

**For a `core-utils` ticket, and it blocks a promotion.** Found by the parity gate 2026-08-21 while
promoting `toJSON`.

#### The defect

`toJSON`'s `output_type` declares the result a `String`, unconditionally:

```ts
output_type() { return { field_config: { type: FieldType.String, array: false } }; }
```

Its implementation does not always return one:

```ts
if (isBigInt(input)) return bigIntToJSON(input);
```

and `bigIntToJSON` (`core-utils/src/numbers.ts`) returns a **number** for anything up to
`Number.MAX_SAFE_INTEGER`:

```ts
if (int <= _maxBigInt) return Number.parseInt(int.toString(10), 10);
return (int - BigInt(1)).toString(10);   // and note the -1, which is its own question
```

So on an `Integer` or `Long` column the registered UDF promises a VARCHAR and hands back a number,
and the query dies with `Invalid Input Error: A string was expected`. Both column types fail, which
is also the evidence that the node binding passes integer columns to a scalar function as `BigInt`
rather than as a JavaScript number — `isBigInt` is the only branch of `toJSON` that can return a
non-string.

#### What it costs

`to_json` renders an integer exactly as `JSON.stringify` does — measured, along with VARCHAR,
BOOLEAN, non-integral DOUBLE, STRUCT and LIST (`docs/tools/probe/remaining-26.mjs`). So the emission
would make these columns work. It is deliberately **withheld** anyway: with no working UDF there is
nothing for the gate to prove parity against, and turning a query that currently dies into one that
silently succeeds is a decision to take in the open, not a side effect of a guard. `JSON_SQL_TYPES`
records that reasoning next to the type list.

The second half of `bigIntToJSON` is worth a look in the same ticket: the `int - BigInt(1)` branch,
whose comment reads "for some reason bigints ending being +1", is subtracting one from every value
above `MAX_SAFE_INTEGER`.

### DF12. A LEADING U+FEFF is stripped on the DuckFrame ingest path; `DataFrame` preserves it

**Found while writing the string emissions** (it is the "U+FEFF cannot round-trip" trap in
`sql-emission.md`, which used to cite a non-existent DF3). Measured 2026-08-26 against the built
`dist`:

```js
const cfg  = { version: 1, fields: { s: { type: 'Keyword' } } };
const recs = [{ s: '\ufeffabc' }, { s: 'a\ufeffb' }, { s: 'abc' }];

DataFrame.fromJSON(cfg, recs)   ->  ['<BOM>abc', 'a<BOM>b', 'abc']   // both preserved
DuckFrame.fromRecords(cfg, recs) ->  ['abc',      'a<BOM>b', 'abc']   // LEADING one gone
```

**Only a LEADING U+FEFF is affected** — an interior one survives on both engines. So this is not
"DuckDB drops the BOM", it is a byte-order-mark strip applied at the start of a string value.

**Why it matters and why it is small.** It is a real `DataFrame`/`DuckFrame` divergence on ingest,
so a value that round-trips today would come back different. But a leading U+FEFF in a *field value*
(as opposed to at the start of a file) is close to always an artifact of bad upstream decoding, and
the DuckFrame behaviour is arguably the more useful one. **It is recorded as a divergence rather
than fixed**, in the same spirit as the shelved D1-D5 coercion defects: pin it in a parity test, do
not "fix" one engine to match the other without a decision.

**Consequence for SQL emission:** none directly — it is an ingest-path difference, not an emission
one, which is what `sql-emission.md` meant to say. A string function that *returns* a leading U+FEFF
hits the same strip on the way back through a UDF result, so an emission and its UDF can still
disagree on such a value; no promoted function has been observed to produce one.

