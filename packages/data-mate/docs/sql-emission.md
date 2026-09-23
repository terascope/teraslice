# SQL emission — what is promoted, what is guarded, and why

**Read this before adding a `sql` emission to a function config.** `test/duck-frame/sql-emission-spec.ts`
is the gate: nothing is promoted by inspection, only by proving byte-equality against the function's own UDF.

## Why

A JS UDF costs ~178 ns/value and runs **strictly single-threaded** — the node binding blocks the DuckDB
worker thread until JS returns; native SQL is 1–2 ns and uses 9–11 cores. **188 of 205 field functions are
promoted**: 51 date, 50 numeric, 46 string, 21 IP, 13 geo, 3 boolean, 2 object, 2 json.

| measurement | result |
|---|---|
| real corpus, 2026-08-21 (`PERFORMANCE.md` §What the SQL promotions bought) | **8.87x** `isIP`, **7.47x** an array transform, **3.93x** `toUpperCase`, **2.98x** a five-function pipeline at 1M rows — **flat at 100k**, where materialising 30 columns swamps the UDF cost |
| two UDFs among five functions | **3.1x** the all-SQL pipeline. One unpromoted function anywhere erases the benefit of every promoted one beside it. `docs/tools/bench/report-transforms.mjs`, `PERFORMANCE.md` §6 |
| the **18x / 125x** figures, 2026-08-18 | a synthetic that is nothing but UDFs aggregated with no table write. **Do not quote them as the value of a promotion** |

**Dictionary compression does not erase the win** (2026-08-25) — it makes a UDF run once per DISTINCT value
rather than once per row, and the gap narrows ~25% and survives. 5 chained transforms, 10M rows,
`sum(strlen(...))`:

| storage state | all SQL | mixed (3 SQL + 2 UDF) | all UDF | UDF / SQL |
|---|---|---|---|---|
| table, uncompressed (right after ingest) | 1.44 s | 5.80 s | 13.84 s | **9.6x** |
| **table, compressed (what production queries)** | 1.40 s | 4.29 s | 10.15 s | **7.3x** |
| parquet view | 1.41 s | 4.09 s | 10.11 s | 7.2x |

## How to add one

1. **Open the `core-utils` function and read it.** Not what the name suggests, and **not what the library it
   appears to wrap does** — this has been got wrong five times, each time expensively:

   | function | what was assumed | what `core-utils` actually has |
   |---|---|---|
   | `isBase64` | `validator.isBase64` | `validator` **plus a lossy UTF-8 round trip** that rejects 99.3% of valid base64 (DF9) |
   | `isEmail` | `validator.isEmail`, 173 procedural lines | **one regex**, RE2-safe, three lines |
   | `isMACAddress` | `validator.isMACAddress`, a separator BACKREFERENCE RE2 cannot compile | **five fixed regexes** in its own table, no backreference |
   | `isPhoneNumberLike` | libphonenumber, because `isISDN`/`toISDN` share its file | `replace(/\D/g, '')` then a length check between 7 and 20 |
   | `isCountryCode` | a locale table, like `isPostalCode` | `validator.isISO31661Alpha2`, **one `Set` of 249 codes** |

   Four of the five were written off as walls in `HANDOFF.md` on the strength of the wrong implementation.
2. **Read the whole function, not the branch you were looking at.** `formatDate` was declined for the
   date-fns vocabulary — true of ONE of `formatDateValue`'s four branches, the others being `epoch_ms(v)`,
   `floor(epoch_ms(v) / 1000)` and a single `strftime`.
3. Write the emission on the config, next to `create`. **It must be NULL-safe: null in, null out.**
4. `npx ts-scripts test --suite unit -- duck-frame/sql-emission-spec`
5. If it fails: fix the emission, guard it, or **withdraw it and write down why** here or in
   `docs/known-defects.md`.

## The descriptor

| field | what it does |
|---|---|
| `expression(ctx)` | builds SQL for ONE value. `ctx.value` is the column, or the lambda variable inside a `list_transform` for an array column — so array handling is free |
| `types` | narrows by column type; defaults to the function's `accepts`. Goes through `validateAccepts`, so `String` admits `Keyword`/`Text` |
| `applies(args, inputConfig)` | narrows by ARGUMENT, for a native that exists only for some of them. Returning false falls back to the UDF for that call only |
| `needs_udf_fallback` | the expression calls `ctx.udf`, so the UDF is still registered. Without it, **no UDF exists at all** and `ctx.udf` throws at plan time |
| `approximate` | agrees to a few ULP rather than bit-exactly. **Transcendental functions only** |

`preferSql: false` on the adapter forces the UDF path — the gate needs it to compare, and a bad emission can
be switched off without a build.

## Extensions are NOT statically linked

`json` and `parquet` are linked in and `icu` loads eagerly; **`inet` and `spatial` are neither.** `inet`
autoloads on first use (`TRY_CAST(x AS INET)` silently pulls it in); **`spatial` does NOT** — a bare
`ST_Intersects` is `Catalog Error: Scalar Function with name "st_intersects" is not in the catalog`.

**A build-time packaging step, not a runtime risk** (measured 2026-08-19, no network, empty extension
directory). Do it at **bootstrap**, where a missing extension surfaces at startup rather than mid-query:

```sql
LOAD '/path/to/inet.duckdb_extension';   -- takes a plain FILE PATH; install_mode stays NOT_INSTALLED
SELECT TRY_CAST('1.2.3.4' AS INET);      -- works immediately
-- DuckDBInstance.create(':memory:', { extension_directory: '/opt/duckdb-extensions' })
```

> **OPEN GAP (verified 2026-09-15): that bootstrap does not exist in `src/`.** No `LOAD spatial` anywhere
> outside `sql-emission-spec.ts`, and the geo predicates have **no UDF path at all** (DF7) — so without it
> they are a dead query, not a slow one.

## Transforms THROW — and the emission must not use `error()`

A validation nulls a bad value; a **transform throws, and that aborts the whole query** (the settled contract,
matching `DataFrame`). `error()` aborts with DuckDB's wording rather than the function's own, so the shape
that keeps both halves is:

```
CASE WHEN <the native branch is exact> THEN <native> ELSE udf(x) END
```

with `needs_udf_fallback`. **Measured: DuckDB's `CASE` and `COALESCE` short-circuit** — an untaken branch
never fires — so the UDF is reached for exactly the values the native branch declines and raises the real
JavaScript error; `coalesce(try(<native>), udf(x))` is the same idea where the native form fails rather than
returning a wrong answer (`decodeBase64` uses it). A transform's gate battery holds only input the function
ACCEPTS, and `throwsOn` names one it rejects, run both ways and required to fail with the **same message**.

## The general traps

| trap | what happens |
|---|---|
| **DuckDB throws where JavaScript returns NaN** | `sqrt(-1)`, `ln(0)`, `ln(-1)` raise `Out of Range Error`, aborting the QUERY, where `Math.sqrt(-1)` is NaN and `runMathFn` nulls it. Check the domain **before** the call — `inDomain`, not `finiteOrNull` |
| **`log` is `ln`** | `Math.log` is natural; DuckDB's `log()` is base-10. The obvious emission silently returns a different number |
| **`VARCHAR::BLOB` refuses non-ASCII** | "All non-ascii characters must be escaped with hex codes". The UTF-8 conversion is `encode()` |
| **JS counts UTF-16 code units, SQL counts characters** | `truncate`, `isLength`, `reverse`. Guard with `HAS_ASTRAL` and let the UDF have astral input |
| **JS applies full Unicode case mapping, DuckDB simple** | `'ß'` uppercases to `SS` in JS and `ẞ` in SQL. Guard with `isAsciiSql` |
| **`Math.round` breaks ties toward +∞, SQL's `round` away from zero** | `Math.round(-2.5)` is `-2`, `round(-2.5)` is `-3`. Emit `floor(x + 0.5)` |
| **A leading U+FEFF cannot round-trip** | Stripped on the DuckFrame ingest path (an INTERIOR one survives; `DataFrame` keeps both). Not an emission problem — **DF12**. There is no DF3 |
| **Transcendentals differ in the last bit** | DuckDB's libm vs V8. IEEE 754 permits it; `approximate` covers it |

## RE2 is not JavaScript's regex engine — and compiling is only half of it

`isRe2Safe` rejects lookaround and backreferences because **RE2 cannot compile them and the query ERRORS**;
that is necessary and not sufficient, because a pattern both engines compile can still MATCH different
characters with nothing erroring — the query just returns different text (DF10). Measured by
`docs/tools/probe/re2-vs-js-regex.mjs` over all 28 characters where the definitions could differ, plus the
astral case the parity gate found afterwards:

| construct | verdict |
|---|---|
| `\w`, `\d`, `\b` | **agree on all 28.** Both ASCII-only, so a pattern built from these needs no guard |
| `\s` | **diverges on 20.** JS is `WhiteSpace` + `LineTerminator` — VERTICAL TAB, NBSP, all of `Zs`, U+2028, U+2029, the BOM. RE2's is exactly `[\t\n\f\r ]` |
| `\S` | inverts on the same 20 |
| `.` | **diverges on 3.** JS excludes CR, U+2028 and U+2029 as well as LF; RE2 excludes only LF |
| `.`, `\S`, `[^...]` over ASTRAL input | **diverges.** JS consumes one UTF-16 CODE UNIT, RE2 one CODE POINT, so `/\S/g` replaces twice in JS and once in SQL. Not fixable by translating the class — it is the unit of matching |
| `\p{...}`, `\P{...}`, `\u{...}` | **silently different.** Property escapes reach RE2 always, JS **only under the `u` flag** — without it `/\p{L}/` matches the literal text `p{L}`. `hasPortableEscapes` rejects them |

Which response applies depends on whether there is a UDF to fall back to:

- **`replaceRegex` GUARDS** — `withClassGuard` emits
  `CASE WHEN regexp_matches(x, <divergent characters + astral>) THEN udf(x) ELSE ... END`, because rejecting
  every pattern containing a `.` would un-promote nearly all of them.
- **`extract` DECLINES** — under `global: true` it returns an array and its UDF is broken (DF4), so a pattern
  containing `.`, `\s`, `\S` or `[^` keeps the UDF entirely, costing `he.*` a native path.

**The reusable lesson is about the argument list, not the regex.** The Keyword battery already held NBSP, an
ideographic space, a tab and astral pairs, so the gate would have caught DF10 the moment a `\s` or `.` pattern
appeared in `replaceRegex`'s `args` — and none did, which is why an arg list needs one entry per branch of
its own `applies` and the spec's `declines` field now asserts the refusals.

## Guarded emissions, and what each guard is for

Every one of these was a gate failure first; the full reasoning lives in the doc comment next to each
emission in `src/function-configs/`.

| function | guard | why |
|---|---|---|
| `toUpperCase`, `toLowerCase` | `strlen(x) = length(x)` (ASCII) | full vs simple case mapping; they agree on all 127 ASCII code points |
| `ceil`, `floor`, `round` | `abs(x) <= 2147483647` | `output_type` is `Integer`; beyond it the UDF returns a wrapped BIGINT as a STRING (DF2) |
| `reverse` | `x = ''` → NULL; `[\p{M}\x{200D}\x{10000}-\x{10FFFF}]` → UDF | `_reverse` nulls on empty and segments by GRAPHEME where `reverse()` is code-point based |
| `truncate`, `isLength` | `HAS_ASTRAL` → UDF | code units vs characters: `truncate` to 3 over four emoji returns a LONE SURROGATE; `isLength` calls five emoji 10 |
| `decodeBase64`, `decodeHex` | `coalesce(try(...), udf(x))` | DuckDB **throws** on malformed input where `Buffer` returns mojibake; `try` also catches valid hex whose bytes are not valid UTF-8 |
| `encodeSHA`, `encodeSHA1` | `applies`: hex digest, `sha256`/`sha1` only | no `sha512`, no base64 digest. `encodeSHA` also **rejects `md5`** — `validate_arguments` requires a hash starting with `sha` |
| `isIP`, `isIPv4`, `isIPv6` | strict IPv4 regex; no `/`; scope stripped before the cast | **`INET` is more permissive than data-mate, silently:** `01.02.03.04` → `1.2.3.4`, `1.2.3.4/24` casts though data-mate calls it a CIDR, and `fe80::1%eth0` is valid to data-mate (`parseIPv6Int` truncates at `%`) and rejected by `INET` |
| `isMappedIPv4` | `::ffff:0:0/96` containment **OR** a regex for `::a.b.c.d` | `IPV4_COMPAT_RE` matches the STRING, so data-mate says true for `::0.0.0.0` and false for `::` — the SAME 128 bits. `::/96` wrongly claims `::` and `::1` |
| `isRoutableIP` | arm order: IPv4 table, then LIFTED v4 table, then v6 table | `isRoutable` reads a mapped address's embedded IPv4 **before** the IPv6 table, so `::ffff:8.8.8.8` is routable though `::ffff:0:0/96` is listed non-routable |
| `inIPRange` | `applies`: `cidr` only | data-mate's `min`/`max` compare RAW INTEGERS, so `::1` sits inside `0.0.0.0`-`255.255.255.255`; `INET` orders all IPv4 before all IPv6. Not fixable by a guard |
| arithmetic and comparison | `applies`: the argument is a FINITE NUMBER | `subtract` has no `required_arguments`, so a missing `value` became `NaN` and spliced in as a **bare identifier** — `Binder Error: Referenced column "NaN" not found`. `needsNumericArgs`/`allowsNumericArgs` |
| `isBooleanLike`, `toBoolean` | `applies`: a Boolean, string or numeric column | they declare `accepts: []` and mean a DIFFERENT THING per type — constant, `_falsy`/`_truthy` lookup, comparison |
| the six `*Values` reducers | `applies`: the column is an ARRAY | `FULL_VALUES` returns a scalar column's value unchanged, and **their UDF path does not work at all** (DF4) — the gate calls `config.create()` directly in JS |
| the date setters | `applies`: the argument's OWN validated range (0-999, 0-59, 0-23, 1-31, 1-12) | they validate in `create()` and **THROW**; a pure SQL emission never calls `create()`, so a bare integer check would let `setHours(25)` roll over |
| `encode`, `createID` | `applies`: an algorithm/digest pair DuckDB has | `md5`/`sha1`/`sha256` give **lowercase hex**; base64 is `to_base64(unhex(...))`; `Buffer`'s hex is `lower(hex(encode(x)))` because `hex()` is UPPERCASE. No `sha512`/`sha384`. `createID` also claims a **scalar string column only** |
| `intToIP` | `applies`: version 4; value guard `^[0-9]+$` and `<= 4294967295` | `HUGEINT` is signed and v6 needs 128 UNSIGNED bits. `BigInt(x)` and `TRY_CAST(x AS HUGEINT)` disagree **eight ways** — SQL takes `'12.0'`, `'12.5'`, `'1e3'`, `'1_000'`; `BigInt` takes `'0x10'`, `'0b11'`, `''`. `^[0-9]+$` sits inside both |
| `setPrecision` | `applies`: a `Float`/`Double`/`Number` column, integral `digits` 0-100; value guard on rounding TIES | the `GeoPoint` path returns a STRUCT (DF7). **`round()` is not `toFixed`**: `round(2.675, 2)` is `2.68`, `toFixed(2)` is `'2.67'`, and `DECIMAL(38, d)` is wrong the same way. `printf('%.{d}f', v)` matches except at exact ties (`printf` half-to-EVEN, `toFixed` half-AWAY) |
| `toNumber` | `applies`: a `Date`, `IP` or numeric column | `epoch_ms(v)`, `ipToInt` arithmetic, identity for integers, identity + `isnan` guard for floats. **A String column keeps the UDF** — `Number('')` is `0`, `Number('0x10')` is `16`, `Number(' 12 ')` is `12` |
| `extract` | `applies`: single-code-point markers, or <=1 group, RE2-safe, portable escapes, no class divergence | `_subSlice` compares `char === start` in a `for...of`, so a two-character marker can never match where `position()` would; `matchAll` interleaves EVERY group and `regexp_extract_all` takes one index |
| `replaceRegex` | value guard: the 21 divergent characters plus astral; `applies`: RE2-safe pattern AND a `$`-free replacement | see the RE2 section (DF10). **`$1` is a capture group in JS and a literal in SQL** — `'abc'`/`/(a)(b)/g`→`'$2$1'` is `'bac'` in JS, `'$2$1c'` in DuckDB, which uses `\1`; `$&`, `` $` ``, `$'`, `$$` all mean something, so any `$` keeps the UDF |
| `isEmail`, `isMACAddress`, `isMIMEType` | none, or `applies`: a delimiter the table has | transliterated patterns — `i` flags expanded to explicit classes, every `\s` replaced by `JS_WHITESPACE_CLASS` — so RE2 case folding and RE2's narrower `\s` never apply. An ARRAY `delimiter` is declined (`macAddressDelimiters[['colon']]` is `undefined`) |
| `isCountryCode` | value guard: ASCII | JS `toUpperCase` is FULL case mapping and can change LENGTH — `'ﬁ'` uppercases to `'FI'`, a real country code |
| `isPhoneNumberLike` | `types`: the string family | it counts digits of `toString(input)`, and JS renders 1e21 as `'1e+21'` (three digits) where DuckDB renders `'1000000000000000000000.0'` (22) |
| `entropy` | `applies`: `shannon`; value guard: astral | the JS builds its frequency table over CODE POINTS and divides by `input.length` (CODE UNITS); the emission declines to reproduce that. The fold needs `+ 0` — a single-distinct-character string gives `-0` |
| `formatDate` | `types: [Date]`; `applies`: a `DateFormat` member or none | three of four branches are one call; the date-fns format branch is the deferred date work |
| `toDate` | `types: [Date]`; `applies`: no format, `iso_8601`, `epoch_millis`, `milliseconds` | `parseDateValue` with no format is `getTime(value)` and `output_type` says Date, so the emission is `value` |
| `toJSON` | `applies`: a scalar String or Boolean column | floats are out (`to_json(2.0)` is `'2.0'`, JS writes `'2'`), Date is out (TIMESTAMP renders without `T`/`Z`), **integers are out because `toJSON`'s own UDF cannot run on them** (DF11) |
| every date function | `types: [Date]` | they also accept `String` and `Number`, and for those the UDF PARSES the value; the emission claims only a real TIMESTAMP column |
| `split` | `applies`: a NON-EMPTY delimiter | the default `''` splits into UTF-16 code units and can return a lone surrogate. Also `noUdfPath`: it RETURNS AN ARRAY and `scalarResultConfig` strips `array`, so the UDF promises VARCHAR and hands back a list |
| `inGeoBoundingBox` | plain inclusive `BETWEEN`s, NOT `ST_Contains` | **verified on turf 7.4.0: `ST_Within`/`ST_Contains` EXCLUDE the boundary** while turf defaults to `ignoreBoundary: false`. `createValidGeoBox` is AXIS-ALIGNED and REJECTS an antimeridian crossing, so no spatial predicate is needed. 325 point/box combinations, no divergence |
| `isGeoJSON`, `isGeoPoint`, `isGeoShape*` | `applies`: a `GeoJSON` column | stored as **`JSON`** (a `GeoPoint` as `STRUCT(lat, lon)`), not `GEOMETRY`, so these need only `json_type`/`json_extract_string`. **No UDF path at all** (DF7) |
| `addToDate`, `subtractFromDate` | `applies`: hours/minutes/seconds only | **`date-fns` works on LOCAL wall-clock time.** Under `TZ=America/New_York`, `addToDate('1900-03-01T00:00:00Z', { months: 1 })` is `1900-03-29`, and day/week units add 23 hours across a DST boundary where `INTERVAL 1 DAY` adds 24. DF6 |
| `getTimeBetween` | `applies`: the epoch intervals only | the `calendar*` family, months, quarters, years, businessDays and ISO-week variants are local calendar arithmetic. `differenceInDays`/`Weeks` ARE epoch-based despite the names |
| the CIDR transforms | `CASE WHEN <valid> THEN <native> ELSE udf(x) END` | four measured guards: **INET arithmetic refuses to leave the subnet** (`network('10.0.0.0/8'::INET) - 1` is `Out of Range Error`) so `host()` drops the prefix first; **`host()` prints a mapped address with a DOTTED tail** (`::ffff:0.0.0.0` vs `::ffff:0:0`) so the mapped range keeps the UDF; **INET equality was false for a `/32`** whose ends print the same, so single-address blocks use `host(a) = host(b)`; and **DuckDB will not reach `255.255.255.255` by addition** |
| `getCIDRNetwork`, `getCIDRBroadcast` | IPv4 CIDR only | the implementation throws for a v6 block where `network`/`broadcast` would happily answer |
| `reverseIP` | IPv4 only | v6 reverses NIBBLES of the fully expanded address — a different algorithm with no native form |

### The spatial predicates diverge from `geo-utils` ON PURPOSE

`geoContains`, `geoWithin`, `geoIntersects`, `geoDisjoint`, `geoRelation`, `geoContainsPoint` and
`geoPointWithinRange` run as `ST_*` because SQL is the more correct of the two — `geoContainsFP` asks the
boundary-inclusive `booleanIntersects(queryPolygon, holePolygon)`, so a shape merely TOUCHING a hole's edge
is reported as not contained. Measured over `docs/tools/probe/geo-predicates.mjs`: `geoIntersects` and
`geoDisjoint` agree on all 324 pairs, `geoContains` diverges on 1 of 256, `geoWithin` on its mirror and
`geoRelation` on 3 of 324 — every one a hole-touching case, written up as **DF8**.

| trap | rule |
|---|---|
| axis order | `ST_Point` takes (x, y) so **LON first**; `ST_Distance_Sphere` takes **(LATITUDE, LONGITUDE)** |
| non-canonical `type` | `ST_GeomFromGeoJSON` THROWS on `"POINT"`, which coercion lets through — hence `tryPredicate`, since for a validation `false` and `NULL` both null the row |

## Semantics that are not what the name suggests

Each verified against the implementation, not assumed.

| function | the surprise |
|---|---|
| `replaceLiteral` | a STRING needle replaces only the **FIRST** match; SQL's `replace()` replaces all, so it is built from `position` + `substring` |
| `isOdd` | `isOdd(-3)` is **false** — it compares `x % 2 === 1` and `-3 % 2` is `-1`. So `mod(x, 2) = 1`, not `abs(mod(x, 2)) = 1` |
| `inNumberRange` | **exclusive** by default, so `BETWEEN` is wrong unless `inclusive` is set |
| `isAfter`, `isBefore`, `isBetween` | **strict on both ends** — `isBetween` is `_isAfter(v, start) && _isBefore(v, end)`, so `BETWEEN` is wrong |
| `toCelsius`, `toFahrenheit` | round to **two decimals** with `Math.round` semantics — `toCelsius(100)` is `37.78` |
| `add`/`subtract`/`multiply`/`divide`/`modulus` | use `addFP` and friends, **not** `runMathFn`, so they return raw `Infinity`/`NaN` rather than null. No finiteness guard |
| `getMonth` | **1-based** — returns `1` for January, unlike `Date.getMonth` |
| `getMilliseconds` | DuckDB's `millisecond` part includes the seconds (`5678`); the emission needs `% 1000` |
| the date getters | **UTC-based despite their names** — `getHours('…T03:04:05Z')` is `3` under `TZ=America/New_York`, not `22` |
| `getTimeBetween` | a TRUNCATED elapsed time, not `date_diff`: `date_diff('hour', …)` counts boundaries crossed, so `00:59`→`01:00` is one boundary and zero full hours |
| `getTimezoneOffset` | **the `date_diff` argument order is the whole thing** — reversed, every non-UTC zone gets the wrong sign and UTC still matches |
| `add` (date-fns) | **silently IGNORES `milliseconds`** (its `Duration` has no such key) and combines years+months into ONE month addition, where two separate `INTERVAL`s clamp twice |
| the date setters | they return **epoch millis**, not a `Date`; `output_type` then declares the field a `Date`, so the emission produces a TIMESTAMP and the two agree at the column |
| `setDate`, `setMonth`, `setYear` | **`Date` ROLLS OVER and DuckDB CLAMPS** — `setUTCDate(31)` on a February date is March 3, `Jan 31 + INTERVAL 1 MONTH` is Feb 28. Rebuild from the enclosing unit's boundary (day 1, nothing can clamp) and add plain days |
| `encodeURL` | `url_encode` over-escapes exactly five characters `encodeURIComponent` leaves alone — `!`, `'`, `(`, `)`, `*`. Un-escaping after is safe: a literal `%` is already `%25` by then |
| `isUUID` | the default `all` is **not** the union of versions 1–8: it also takes the nil and max UUIDs, and still requires the `[89ab]` variant nibble |
| `isPort` | `isInt(x, { min: 0, max: 65535 })`, and the INT half is the fiddly one: `'007'` is **false** (leading zero), `'+80'` is **true**, `' 80'` and `'80.5'` are false |
| `isEpoch` | `toInteger` TRUNCATES toward zero rather than rejecting a fraction, so `isUnixTime(0.5)` is true and `-0.6` passes `allowBefore1970: false` while `-1.6` does not. Hence `trunc(x) >= 0` |
| `isGeoShape*` | matches `type` **case-exactly** against `'Point'`/`'point'` while `isGeoJSON` lowercases first, so `'POINT'` passes `isGeoJSON` and fails `isGeoShapePoint` |
| `isDate` | **a constant** on a real `Date` column — it is already a `TIMESTAMP`. `applies` declines a CUSTOM format, a question a TIMESTAMP column cannot be asked |
| `isEmpty` | **a constant for a number or a boolean** — the chain ends in `return true`, so `isEmpty(5)` and `isEmpty(true)` are TRUE. Only a string has a `.length` to consult |
| `isBoolean`, `isString` | **constants** — a typed column either holds booleans or it does not, and a `String` column's every non-null value is a string |
| `isFalsy` on `''` | it returns early on `input === ''` BEFORE trimming, so `''` is falsy and `'   '` is not; the emission tests the empty string unnormalised and separately |
| `isAlpha`, `isAlphaNumeric` | the ONLY `validator`-backed predicates promoted, because `en-US` is `/^[A-Za-z]+$/` and `/^[0-9A-Za-z]+$/` exactly. `applies` claims the default locale only |
| `equals`, `setDefault` | `applies`: a scalar column and a primitive argument of the SAME KIND. Mixing kinds is not a SQL error — `coalesce(varchar_col, 5)` casts happily — but the UDF never converts at all |
| `subtractValues`, `divideValues` | a LEFT FOLD, not `first - sum(rest)`: `[1, null, 10, 3]` is `-12`, nulls skipped not zeroed. `list_reduce` over an EMPTY list **raises**, so the emptiness guard is required |
| `truncate` | `size` must be positive — the function rejects `0` |

## Not promoted, and why

| function | reason |
|---|---|
| `expm1`, `log1p` | `exp(x) - 1` and `ln(1 + x)` lose catastrophically for small `x` — `Math.expm1(1e-7)` differs from `exp(1e-7) - 1` in the 8th digit, far beyond ULP |
| `isURL` | **genuinely `validator`**: 13 options, procedural parsing of protocol, auth, host, port, path and fragment, a TLD requirement and a 2084-character length cap |
| `isPostalCode` | a table of ~60 per-country patterns, and `'any'` tries all of them. A question of size, not of risk |
| `isISDN`, `toISDN` | `awesome-phonenumber`. These two really are libphonenumber |
| `timezoneToOffset` | `tzOffset(zone)` with no date, so it means "right now" — non-deterministic |
| `lookupTimezone`, `setTimezone`, `toTimeZone`, `toTimeZoneUsingLocation`, `toGeoJSON`, `toGeoPoint`, `cast`, `parseJSON`, `lookup`, `random` | **reason NOT RECORDED** — confirmed unpromoted in `src/` 2026-09-15, but no rationale was ever written down. Verify before assuming one |
