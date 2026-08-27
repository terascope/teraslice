# SQL emission — what is promoted, what is guarded, and why

**Read this before adding a `sql` emission to a function config.** It is the record of every guard,
special case and rejection so far, and of the traps that produced them. `test/duck-frame/
sql-emission-spec.ts` is the gate that enforces all of it.

## The point

A JavaScript UDF costs ~178 ns per value of pure marshalling and runs **strictly single-threaded** —
the node binding blocks the DuckDB worker thread until JS returns. Native SQL is 1–2 ns and uses
9–11 cores.

**What that is worth, on the real corpus** (measured 2026-08-21, `PERFORMANCE.md` §What the SQL
promotions bought): **8.87x** on `isIP`, **7.47x** on an array transform, **3.93x** on `toUpperCase`,
**2.98x** on a five-function pipeline at 1M rows — and **flat at 100k**, where materialising 30 columns
swamps the UDF cost.

> The **18x / 125x** figures measured 2026-08-18 are real for the *synthetic* they came from — a query
> that is nothing but UDFs, aggregated with no table write. They do **not** describe the real corpus and
> should not be quoted as the value of a promotion.

**MEASURED 2026-08-25 on a CHECKPOINTED table, which was the open question.** Dictionary compression
makes a UDF run once per DISTINCT value rather than once per row, so the fear was that it would erase
the promotion win on the table production actually queries. It does not:

| storage state | all SQL | mixed (3 SQL + 2 UDF) | all UDF | UDF / SQL |
|---|---|---|---|---|
| table, uncompressed (right after ingest) | 1.44 s | 5.80 s | 13.84 s | **9.6x** |
| **table, compressed (what production queries)** | 1.40 s | 4.29 s | 10.15 s | **7.3x** |
| parquet view | 1.41 s | 4.09 s | 10.11 s | 7.2x |

5 chained transforms, 10M rows, forced with `sum(strlen(...))`. **The win narrows ~25% and survives.**
The checkpoint helps the UDF path only and does nothing for the SQL path.

**And the number that argues for finishing the remaining 17:** two UDFs among five functions cost
**3.1x** the all-SQL pipeline. One unpromoted function anywhere in a query erases the benefit of every
promoted one beside it. Bench: `tools/bench/report-transforms.mjs`; tables in `PERFORMANCE.md` §6.

**188 of the 205 field functions are promoted** as of 2026-08-21: 51 date, 50 numeric, 46 string, 21 IP, 13 geo, 3 boolean, 2 object, 2 json.

An emission that is not *provably* identical to its UDF is worse than no emission, so nothing is
promoted by inspection — only by the gate.

## How to add one

1. **Find out what the function actually does.** Not what its name suggests, and **not what the
   library it appears to wrap does** - open the `core-utils` function and read it. This step has now
   been got wrong five times, each time expensively:

   | function | what was assumed | what `core-utils` actually has |
   |---|---|---|
   | `isBase64` | `validator.isBase64` | `validator` **plus a lossy UTF-8 round trip** that rejects 99.3% of valid base64 (DF9) |
   | `isEmail` | `validator.isEmail`, 173 procedural lines | **one regex**, RE2-safe, three lines |
   | `isMACAddress` | `validator.isMACAddress`, a separator BACKREFERENCE RE2 cannot compile | **five fixed regexes** in its own table, no backreference anywhere |
   | `isPhoneNumberLike` | libphonenumber, because `isISDN` and `toISDN` share its file | `replace(/\D/g, '')` then a length check between 7 and 20 |
   | `isCountryCode` | a locale table, like `isPostalCode` | `validator.isISO31661Alpha2`, which is **one `Set` of 249 codes** |

   Four of those five were written off as walls in `HANDOFF.md` on the strength of the wrong
   implementation. All five are now promoted.

2. **Read the whole function, not the branch you were looking at.** `formatDate` was declined
   because "translating the date-fns format vocabulary is its own project" - true of ONE of
   `formatDateValue`'s four branches. The other three are `epoch_ms(v)`,
   `floor(epoch_ms(v) / 1000)` and a single `strftime`. `toDate` on a Date column with no format is
   **identity**. `entropy` was declined for needing "per-character aggregation inside a scalar
   expression", which `string_split` + `list_filter` + `list_reduce` does exactly.
3. Write the emission on the config, next to `create`.
4. Run `npx ts-scripts test --suite unit -- duck-frame/sql-emission-spec`.
5. If it fails, either fix the emission, guard it, or **withdraw it and write down why** in
   `docs/known-defects.md` or here.

## The descriptor

| field | what it does |
|---|---|
| `expression(ctx)` | builds SQL for ONE value. `ctx.value` is the column, or the lambda variable inside a `list_transform` for an array column — so array handling is free |
| `types` | narrows by column type. Goes through `validateAccepts`, so `String` admits `Keyword`/`Text` |
| `applies(args, inputConfig)` | narrows by ARGUMENT, for a native that exists only for some of them |
| `needs_udf_fallback` | the expression calls `ctx.udf`, so the UDF is still registered. Without it, **no UDF exists at all** |
| `approximate` | agrees to a few ULP rather than bit-exactly. **Transcendental functions only** |

`preferSql: false` on the adapter forces the UDF path — the gate needs it to compare, and a bad
emission can be switched off without a build.

## The `inet` extension — a packaging step, and a small one

The IP emissions need the `inet` extension. It is not statically linked into `@duckdb/node-api` -
`duckdb_extensions()` reports `loaded: false` / `install_mode: REPOSITORY` at startup, and it lands
in `~/.duckdb/extensions/v1.5.5/<platform>/` the first time a query touches `INET`. `json` and
`parquet` are linked in; `icu` is loaded eagerly; `inet` and `spatial` are neither.

**That is a build-time packaging step, not a runtime risk.** Measured 2026-08-19, with no network
and an empty extension directory:

```sql
LOAD '/path/to/inet.duckdb_extension';   -- succeeds; install_mode stays NOT_INSTALLED
SELECT TRY_CAST('1.2.3.4' AS INET);      -- works immediately
```

`LOAD` takes a plain file path, and `extension_directory` is settable when the instance is created
(`DuckDBInstance.create(':memory:', { extension_directory: '/opt/duckdb-extensions' })`). So any of
these is sufficient, and all of them are ordinary:

1. `INSTALL inet;` at image build time, with `extension_directory` pointed at the baked directory.
2. `COPY` the `.duckdb_extension` file into the image and `LOAD` it by path at bootstrap.
3. Leave autoloading on where the worker has network - it is the default and it already works.

The only thing to be deliberate about is that `LOAD` should happen at bootstrap, so a missing
extension surfaces at startup rather than mid-query.

**`spatial` differs from `inet` in one important way: it does NOT autoload.** A bare `ST_Intersects`
is `Catalog Error: Scalar Function with name "st_intersects" is not in the catalog`, where
`TRY_CAST(x AS INET)` silently pulled `inet` in. So a geo emission needs an explicit `LOAD spatial`
at bootstrap — and because no geo function has a UDF path at all (DF7), there is nothing to fall
back to if it is missing. That bootstrap does not exist yet, and it is now the ONLY thing between
these two and promotion:

| function | measured against DuckDB | blocked on |
|---|---|---|
| `geoIntersects` | **MATCHES all 324 pairs** | the `LOAD spatial` bootstrap — no behavioural difference |
| `geoDisjoint` | **MATCHES all 324 pairs** | the `LOAD spatial` bootstrap — no behavioural difference |

`tools/probe/geo-predicates.mjs` is the probe. Its matrix covers reversed winding, edge-sharing,
corner-only touching, single and double holes, MultiPolygon with and without holes, and points on
the interior, an edge, a vertex, a hole edge and outside.

## Transforms THROW — and the emission must not use `error()`

A validation nulls a bad value; a **transform throws, and that aborts the whole query** - the
settled failure contract, matching `DataFrame`. An emission has to reproduce that, and the obvious
way is wrong.

`error('...')` does abort, but with DuckDB's wording rather than the function's own, so the caller
gets a different message for the same bad data. The shape that keeps both halves is:

```
CASE WHEN <the native branch is exact> THEN <native> ELSE udf(x) END
```

with `needs_udf_fallback`. **Measured: DuckDB's `CASE` short-circuits** - `error()` in an untaken
branch never fires, and neither does a UDF - so the UDF is reached for exactly the values the native
branch declines, and it raises the real JavaScript error. `COALESCE` short-circuits too, and `try()`
catches an INET conversion error, so `coalesce(try(<native>), udf(x))` is the same idea where the
native form fails rather than returning a wrong answer (that is what `decodeBase64` uses).

The gate asserts both halves. A transform's battery holds only input the function ACCEPTS - one bad
value would kill the query on both paths and leave nothing to compare - and `throwsOn` names an
input it rejects, which is then run both ways and required to fail with the **same message**.

## The general traps

These bit more than one function, so they are stated once.

| trap | what happens |
|---|---|
| **DuckDB throws where JavaScript returns NaN** | `sqrt(-1)`, `ln(0)`, `ln(-1)` raise `Out of Range Error`, aborting the QUERY, where `Math.sqrt(-1)` is NaN and `runMathFn` turns it into null. The domain must be checked **before** the call — `inDomain`, not `finiteOrNull` |
| **`log` is `ln`** | `Math.log` is the natural logarithm; DuckDB's `log()` is base-10. The obvious emission silently returns a different number |
| **`VARCHAR::BLOB` refuses non-ASCII** | "All non-ascii characters must be escaped with hex codes". The UTF-8 conversion is `encode()` |
| **JS counts UTF-16 code units, SQL counts characters** | `truncate`, `isLength`, `reverse`. Guard with `HAS_ASTRAL` and let the UDF have astral input |
| **JS applies full Unicode case mapping, DuckDB simple** | `'ß'` uppercases to `SS` in JS and `ẞ` in SQL. Guard with `isAsciiSql` |
| **`Math.round` breaks ties toward +∞, SQL's `round` away from zero** | `Math.round(-2.5)` is `-2`, `round(-2.5)` is `-3`. Emit `floor(x + 0.5)` |
| **A leading U+FEFF cannot round-trip** | It is stripped on the DuckFrame ingest path (an INTERIOR one survives; `DataFrame` keeps both). Not an emission problem — **known-defects DF12**, written up 2026-08-26. There is no DF3; this entry used to cite it |
| **Transcendentals differ in the last bit** | DuckDB's libm vs V8. IEEE 754 permits it; `approximate` covers it |

## RE2 is not JavaScript's regex engine - and compiling is only half of it

`isRe2Safe` rejects lookaround and backreferences because **RE2 cannot compile them and the query
ERRORS**. That is necessary and it is not sufficient: a pattern both engines compile can still MATCH
different characters, and nothing errors - the query just returns different text. This cost a
promoted function a silent wrong answer (known-defects DF10), so it is stated here in full.

Measured by `docs/tools/probe/re2-vs-js-regex.mjs` over all 28 characters where the definitions
could differ, plus the astral case the parity gate found afterwards:

| construct | verdict |
|---|---|
| `\w`, `\d`, `\b` | **agree on all 28.** Both are ASCII-only, so a pattern built from these needs no guard |
| `\s` | **diverges on 20.** JavaScript's is `WhiteSpace` + `LineTerminator` - VERTICAL TAB, NBSP, all of `Zs`, U+2028, U+2029, the BOM. RE2's is exactly `[\t\n\f\r ]` |
| `\S` | inverts on the same 20 |
| `.` | **diverges on 3.** JavaScript's excludes CR, U+2028 and U+2029 as well as LF; RE2's excludes only LF |
| `.`, `\S`, `[^...]` over ASTRAL input | **diverges.** JavaScript consumes one UTF-16 CODE UNIT, RE2 one CODE POINT, so `/\S/g` over an astral character replaces twice in JavaScript and once in SQL. Not fixable by translating the class - it is the unit of matching, not the membership |
| `\p{...}`, `\P{...}`, `\u{...}` | **silently different.** Unicode property escapes to RE2 always, and to JavaScript **only under the `u` flag** - without it `/\p{L}/` matches the literal text `p{L}`. `hasPortableEscapes` rejects them |

Two responses, and which applies depends on whether there is a UDF to fall back to:

- **`replaceRegex` GUARDS the value.** `withClassGuard` wraps the native call in
  `CASE WHEN regexp_matches(x, <the divergent characters + astral>) THEN udf(x) ELSE ... END`, so
  real text runs native and an exotic value keeps JavaScript's own classes. Guarding rather than
  declining matters because rejecting every pattern containing a `.` would un-promote nearly all of
  them.
- **`extract` DECLINES.** Under `global: true` it returns an array and its UDF is broken (DF4), so
  the emission has to be self-sufficient or absent. A pattern containing `.`, `\s`, `\S` or `[^`
  keeps the UDF entirely. That costs `he.*` a native path.

**The reusable lesson is about the argument list, not the regex.** The Keyword battery already held
NBSP, an ideographic space, a tab and astral pairs - the gate would have caught DF10 the moment a
`\s` or `.` pattern appeared in `replaceRegex`'s `args`, and none did. An arg list needs one entry
per branch of its own `applies`, and the spec's `declines` field now asserts the refusals instead of
leaving them assumed.

## Guarded emissions, and what each guard is for

Every one of these was a gate failure first.

| function | guard | why |
|---|---|---|
| `toUpperCase`, `toLowerCase` | `strlen(x) = length(x)` (ASCII) | full vs simple case mapping. They agree on all 127 ASCII code points, so only non-ASCII pays for JS |
| `ceil`, `floor`, `round` | `abs(x) <= 2147483647` | `output_type` is `Integer`; beyond it the UDF path returns a wrapped BIGINT as a STRING (DF2). Inside the range SQL is exact |
| `reverse` | `x = ''` → NULL, `[\p{M}\x{200D}\x{10000}-\x{10FFFF}]` → UDF | `_reverse` returns null for empty, and uses **grapheme** segmentation for astral/ZWJ/combining input where `reverse()` is code-point based. RE2 matches the same set as its own JS regex |
| `truncate`, `isLength` | `HAS_ASTRAL` → UDF | code units vs characters: `truncate` to 3 over four emoji returns a LONE SURROGATE today; `isLength` calls five emoji a length of 10 |
| `decodeBase64`, `decodeHex` | `coalesce(try(...), udf(x))` | DuckDB **throws** on malformed input — aborting the query — where `Buffer` is lenient and returns mojibake. `try` also catches valid hex whose bytes are not valid UTF-8, which no input regex could see |
| `encodeSHA`, `encodeSHA1` | `applies`: hex digest, `sha256`/`sha1` only | DuckDB has no `sha512` and no base64 digest. `encodeSHA` also **rejects `md5` itself** — its `validate_arguments` requires a hash starting with `sha` |
| `isIP`, `isIPv4`, `isIPv6` | strict IPv4 regex; no `/`; scope stripped before the cast | **`INET` is more permissive than data-mate, silently.** `01.02.03.04` casts to `1.2.3.4` where `IPV4_RE` rejects a leading zero; `1.2.3.4/24` casts as a prefixed address where data-mate calls it a CIDR; and `fe80::1%eth0` is valid to data-mate (`parseIPv6Int` truncates at `%`) and rejected outright by `INET`. All three were found by `tools/probe/ip-semantics.mjs`, not by inspection |
| `isMappedIPv4` | `::ffff:0:0/96` containment **OR** a regex for `::a.b.c.d` | data-mate answers true for `::0.0.0.0` and false for `::`, which are the SAME 128 bits, because `IPV4_COMPAT_RE` matches the input STRING. No containment test can tell them apart; `::/96` - the obvious emission - wrongly claims `::` and `::1` |
| `isRoutableIP` | arm order: IPv4 table, then LIFTED v4 table, then v6 table | `IPAddress.isRoutable` classifies a mapped address by its embedded IPv4 **before** consulting the IPv6 table, so `::ffff:8.8.8.8` is routable even though `::ffff:0:0/96` is itself listed non-routable. Checking the v6 table first inverts the answer. The v4 prefixes are lifted by 96 bits into both `::ffff:` and `::` space rather than extracting the low 32 bits |
| `inIPRange` | `applies`: `cidr` only | `min`/`max` compare RAW INTEGERS in data-mate, so `::1` sits inside `0.0.0.0`-`255.255.255.255`; `INET` ordering puts every IPv4 address before every IPv6 one and answers false. Not fixable by a guard |
| the arithmetic and comparison emissions | `applies`: the argument is a FINITE NUMBER | `subtract` declares no `required_arguments`, so a call without `value` reached the emission as `undefined`, `Number(undefined)` is `NaN`, and `NaN` splices in as a **bare identifier**: `Binder Error: Referenced column "NaN" not found`. It aborted the query where the UDF quietly returns `NaN` per row. Caught by `function-sweep-spec`, fixed with `needsNumericArgs`/`allowsNumericArgs` |
| `isBooleanLike`, `toBoolean` | `applies`: a Boolean, string or numeric column | they declare `accepts: []` and mean a DIFFERENT THING per type - a constant for a boolean, a lookup in the `_falsy`/`_truthy` tables for a string, a comparison for a number. Anything else keeps the UDF |
| the six `*Values` reducers | `applies`: the column is an ARRAY | they are `FULL_VALUES` and return a scalar column's value unchanged, so only the array shape has a native form. **Their UDF path does not work at all** (known-defects DF4), so the gate proves them against `config.create()` called directly in JavaScript |
| the date setters | `applies`: the argument's OWN validated range (0-999, 0-59, 0-23, 1-31, 1-12) | they validate in `create()` and **THROW** - `setHours(25)` is `hours value must be an integer between 0 and 23`. A pure SQL emission never calls `create()`, so a bare integer check would let `25` through and quietly return the next day at 01:00 |
| `encode`, `createID` | `applies`: an algorithm/digest pair DuckDB has | `md5`/`sha1`/`sha256` exist and give **lowercase hex**, matching `createHash(...).digest('hex')`; a base64 digest is `to_base64(unhex(...))`, so `encode` can offer one where `encodeSHA` could not. `Buffer`'s `hex` is `lower(hex(encode(x)))` - `hex()` is UPPERCASE - and its `base64` is `to_base64(encode(x))`. No `sha512`, no `sha384`. `createID` additionally claims a **scalar string column only**: its array path is `value.flat().map(toString).join('')`, and reproducing `toString` for numbers, booleans and nested arrays is a guess |
| `intToIP` | `applies`: version 4; value guard `^[0-9]+$` and `<= 4294967295` | v6 needs 128 UNSIGNED bits and `HUGEINT` is signed. The value guard is narrower than a cast on purpose: measured, `BigInt(x)` and `TRY_CAST(x AS HUGEINT)` disagree **eight ways** - SQL accepts `'12.0'`, `'12.5'`, `'1e3'` and `'1_000'` where `BigInt` THROWS, and `BigInt` accepts `'0x10'`, `'0b11'` and `''` where the cast is null. `^[0-9]+$` sits inside both |
| `setPrecision` | `applies`: a `Float`/`Double`/`Number` column and integral `digits`; value guard on rounding TIES | the `GeoPoint` path returns a STRUCT (DF7). **`round()` is not `toFixed`**: `round(2.675, 2)` is `2.68` and `toFixed(2)` is `'2.67'`, because `toFixed` rounds the exact binary expansion (2.674999...) and `round` rounds the decimal it looks like. `CAST AS DECIMAL(38, d)` gets it wrong the same way. `printf('%.{d}f', v)` works on the exact value like `toFixed` and differs only at exact ties, where `printf` rounds half to EVEN and `toFixed` half AWAY FROM ZERO - so a value whose `(d+1)`-digit rendering ends in `5` keeps the UDF, which is exact rather than merely cautious: a tie IS a value terminating in `5` at that digit |
| `toNumber` | `applies`: a `Date`, `IP` or numeric column | `create` branches on the column type and only three of four branches have a native form: `epoch_ms(v)` for `Date`, `ipToInt`'s arithmetic for `IP`, identity for the integers, identity with an `isnan` guard for the floats (`convertToNumber` THROWS on `NaN`). **A String column keeps the UDF**: `convertToNumber` is `Number(input)`, and `Number('')` is `0`, `Number('0x10')` is `16` and `Number(' 12 ')` is `12` - no DuckDB cast reproduces that set, and the failure mode is a wrong number rather than an error |
| `extract` | `applies`: single-code-point markers, or a pattern with <=1 group, RE2-safe, portable escapes and no class divergence | `_subSlice` compares `char === start` inside `for (const char of input)`, so a two-character marker can never match - a native `position()` WOULD find it, a different answer rather than a slower one. `matchAll` pushes EVERY group of every match interleaved and `regexp_extract_all` takes one group index. And it **declines** `.`/`\s`/`\S`/`[^` rather than guarding them, because under `global` there is no working UDF to fall back to (DF4) - see the RE2 section |
| `replaceRegex` | value guard: the 21 divergent characters plus astral | see the RE2 section - this was DF10 |
| `isEmail`, `isMACAddress`, `isMIMEType` | none, or `applies`: a delimiter the table has | transliterated patterns, with the `i` flags expanded into explicit classes and every `\s` replaced by `JS_WHITESPACE_CLASS` - so RE2 case folding and RE2's narrower `\s` never enter the picture and no value guard is needed. An ARRAY `delimiter` is declined because `macAddressDelimiters[['colon']]` is `undefined` and the implementation throws on it too |
| `isCountryCode` | value guard: ASCII | `toUpperCase` is FULL case mapping and can change a string's LENGTH - `'\ufb01'` uppercases to `'FI'`, a real country code - where DuckDB's simple mapping leaves it as one character |
| `isPhoneNumberLike` | `types`: the string family | it counts the digits of `toString(input)`, and JavaScript renders 1e21 as `'1e+21'` (three digits) where DuckDB renders `'1000000000000000000000.0'` (22) |
| `entropy` | `applies`: `shannon`; value guard: astral | the JavaScript builds its frequency table with `for...of` over CODE POINTS and divides by `input.length`, which counts CODE UNITS. The two differ only for astral input, and the emission declines to reproduce the inconsistency. The fold also needs `+ 0`: for a single-distinct-character string the term is `-0` |
| `formatDate` | `types: [Date]`; `applies`: a `DateFormat` member or none | three of four branches are one call; the date-fns format branch is the deferred date work |
| `toDate` | `types: [Date]`; `applies`: no format, `iso_8601`, `epoch_millis` or `milliseconds` | `parseDateValue` with no format is `getTime(value)` and `output_type` says Date, so the column's own TIMESTAMP is the answer - the emission is `value` |
| `toJSON` | `applies`: a scalar String or Boolean column | `to_json` matches `JSON.stringify` on those, and on STRUCT and LIST including key order. Floating point is out because `to_json(2.0)` is `'2.0'` where JavaScript writes `'2'`; Date is out because a TIMESTAMP renders without the `T` or the `Z`; **integers are out because `toJSON`'s own UDF cannot run on them at all** - DF11 |
| every date function | `types: [Date]` | they accept `Date`, `String` AND `Number`, and for the latter two the UDF PARSES the value. The emission claims only a real TIMESTAMP column |
| `replaceRegex` | `applies`: an RE2-safe pattern AND a `$`-free replacement | **RE2 has no lookaround or backreferences and ERRORS rather than differing** — a dead query, not a slow path. And **`$1` is a capture group in JavaScript and a literal in SQL**: `'abc'` with `/(a)(b)/g` → `'$2$1'` is `'bac'` in JS and `'$2$1c'` in DuckDB, which uses `\1`. Translating is possible but `$&`, `` $` ``, `$'` and `$$` all mean something too, so a `$` anywhere keeps the UDF |
| `split` | `applies`: a NON-EMPTY delimiter | the default is `''`, and `String(x).split('')` splits into UTF-16 code units — it can return a lone surrogate, the same problem `truncate` has. Also `noUdfPath`: it RETURNS AN ARRAY and `scalarResultConfig` strips `array`, so the UDF promises VARCHAR and hands back a list |
| `inGeoBoundingBox` | plain range checks, NOT `ST_Contains` | **verified on turf 7.4.0: `ST_Within`/`ST_Contains` EXCLUDE the boundary — a point on an edge is `false` — while turf's `booleanPointInPolygon` defaults to `ignoreBoundary: false` and includes it.** A deliberate semantic difference, not a bug an upgrade fixes. But a spatial predicate was never needed: `createValidGeoBox` builds an AXIS-ALIGNED box and REJECTS one crossing the antimeridian, so containment is two inclusive `BETWEEN`s — boundary-inclusive by construction. 325 point/box combinations, every edge and corner: no divergence |
| the geo shape predicates | `applies`: a `GeoJSON` column | a `GeoJSON` column is stored as **`JSON`** and a `GeoPoint` as `STRUCT(lat, lon)`, not as a spatial `GEOMETRY` — so these need no `spatial` extension, only `json_type`/`json_extract_string`. And they have **no UDF path at all** (known-defects DF7), so the emission is the only way they can run |
| `addToDate`, `subtractFromDate` | `applies`: hours/minutes/seconds only | **`date-fns` works on LOCAL wall-clock time.** Under `TZ=America/New_York`, `addToDate('1900-03-01T00:00:00Z', { months: 1 })` is `1900-03-29`, not `1900-04-01`; day and week units add 23 hours across a DST boundary where `INTERVAL 1 DAY` adds 24. Time units are exact epoch arithmetic on both sides. See known-defects DF6 |
| `getTimeBetween` | `applies`: the epoch intervals only | the `calendar*` family, months, quarters, years, businessDays and the ISO-week variants are local calendar arithmetic. `differenceInDays`/`Weeks` are epoch-based despite the names, so they ARE promoted |
| the CIDR transforms | `CASE WHEN <valid> THEN <native> ELSE udf(x) END` | the throw contract above. Four separate guards were needed, each measured: **INET arithmetic refuses to leave the subnet** (`network('10.0.0.0/8'::INET) - 1` is `Out of Range Error`), so the prefix is dropped with `host()` first; **`host()` prints a mapped address with a DOTTED tail** (`::ffff:0.0.0.0` vs `intToIPv6String`'s `::ffff:0:0`), so the mapped range keeps the UDF; **INET equality did not answer true for a `/32`** whose ends print the same, so single-address blocks are compared with `host(a) = host(b)`; and **DuckDB will not reach `255.255.255.255` by addition**, so the one block whose first-usable address is the broadcast keeps the UDF |
| `getCIDRNetwork`, `getCIDRBroadcast` | IPv4 CIDR only | the implementation throws for a v6 block. `network`/`broadcast` would happily answer, so without the guard SQL returns a value where the UDF raises |
| `reverseIP` | IPv4 only | v6 reverses NIBBLES of the fully expanded address - a different algorithm with no native form |

## Semantics that are not what the name suggests

Each verified against the implementation, not assumed.

| function | the surprise |
|---|---|
| `replaceLiteral` | `input.replace(search, …)` with a STRING needle replaces only the **FIRST** match. SQL's `replace()` replaces all of them, so it is built from `position` + `substring` |
| `isOdd` | `isOdd(-3)` is **false** — it compares `x % 2 === 1` and `-3 % 2` is `-1`. So `mod(x, 2) = 1`, not `abs(mod(x, 2)) = 1` |
| `inNumberRange` | **exclusive** by default, so `BETWEEN` is wrong unless `inclusive` is set |
| `toCelsius`, `toFahrenheit` | round to **two decimals** — `toCelsius(100)` is `37.78` — with `Math.round` semantics |
| `add`/`subtract`/`multiply`/`divide`/`modulus` | use `addFP` and friends, **not** `runMathFn`, so they return raw `Infinity`/`NaN` rather than null. No finiteness guard |
| `getMonth` | **1-based** — returns `1` for January, unlike `Date.getMonth` |
| `getTimeBetween` | a TRUNCATED elapsed time, not `date_diff`. `date_diff('hour', …)` counts boundaries crossed; `differenceInHours` truncates, so `00:59`→`01:00` is one boundary and zero full hours |
| `getTimezoneOffset` | **the `date_diff` argument order is the whole thing.** Reversed, every non-UTC zone comes back with the wrong sign and UTC still matches — a battery without a real zone would not notice |
| `add` (date-fns) | **silently IGNORES `milliseconds`** — its `Duration` has no such key — and combines years+months into ONE month addition, where two separate `INTERVAL`s clamp twice |
| `encodeURL` | `url_encode` over-escapes exactly five characters `encodeURIComponent` leaves alone — `!`, `'`, `(`, `)`, `*`. Un-escaping them afterwards is safe rather than heuristic: a literal `%` is already `%25` by then, so a `%21` in the output can only have come from a real `!` |
| `isHash` | it is only `^[a-fA-F0-9]{N}$` with N from a length table — nothing the name hides |
| `isUUID` | the default `all` is **not** the union of versions 1–8: it also takes the nil and max UUIDs, and still requires the `[89ab]` variant nibble. Written out rather than derived, because deriving it is where a guess would creep in |
| `isPort` | `validator.isPort` is `isInt(x, { min: 0, max: 65535 })`, and the INT half is the fiddly one: `'007'` is **false** (a leading zero is not an integer) while `'+80'` is **true**, and `' 80'` and `'80.5'` are false |
| `isEpoch` | `toInteger` TRUNCATES toward zero rather than rejecting a fraction, so `isUnixTime(0.5)` is true and `-0.6` passes `allowBefore1970: false` while `-1.6` does not. Hence `trunc(x) >= 0` |
| `isGeoShape*` | matches `type` **case-exactly** against two spellings (`'Point'`/`'point'`), while `isGeoJSON` lowercases first — so `'POINT'` passes `isGeoJSON` and fails `isGeoShapePoint`. Coercion normalises `'point'` to `'Point'` but leaves `'POINT'` alone |
| `isDate` | **a constant** on a real `Date` column - it is already a `TIMESTAMP`, so `isValidDate` cannot say no. `applies` declines a CUSTOM format, which asks a different question ("does this string match this `date-fns` pattern") that a TIMESTAMP column cannot be asked |
| `isEmpty` | **a constant for a number or a boolean.** `isEmpty` falls through its whole chain and ends in `return true`, so `isEmpty(5)` and `isEmpty(true)` are both TRUE. Only a string has a `.length` for the check to consult, so only there does the answer depend on the value |
| `isAlpha`, `isAlphaNumeric` | the ONLY `validator`-backed predicates promoted, because `en-US` is `/^[A-Za-z]+$/` and `/^[0-9A-Za-z]+$/` exactly. `applies` claims the default locale only; the others each have their own letter set |
| `equals`, `setDefault` | `applies`: a scalar column and a primitive argument of the SAME KIND. Mixing kinds is not a SQL error - `coalesce(varchar_col, 5)` casts happily - but that cast is DuckDB's where the UDF path never converts at all |
| `isBoolean`, `isString` | **constants.** `isBoolean` is `typeof x === 'boolean'` and a typed column either holds booleans or it does not; `isString` only claims a `String` column, where every non-null value is a string. The value is never consulted, and a per-row UDF call for a predicate that could not say no disappears |
| `isFalsy` on `''` | it returns early on `input === ''`, BEFORE trimming - so `''` is falsy and `'   '` is not, even though they trim to the same thing. The emission tests the empty string unnormalised and separately |
| `subtractValues`, `divideValues` | a LEFT FOLD, not `first - sum(rest)`: `[1, null, 10, 3]` is `-12`, and nulls are skipped rather than treated as zero. `list_reduce` over an EMPTY list **raises** `Cannot perform list_reduce on an empty input list` where the JS reducer returns null, so the emptiness guard is required, not defensive |
| the date setters | they return **epoch millis**, not a `Date` — `setUTCHours` returns a timestamp. `output_type` then declares the field a `Date`, so the emission produces a TIMESTAMP and the two agree at the column |
| `setDate`, `setMonth`, `setYear` | **`Date` ROLLS OVER and DuckDB CLAMPS.** `setUTCDate(31)` on a February date is March 3; `Jan 31 + INTERVAL 1 MONTH` is Feb 28. Rebuilding from the enclosing unit's boundary — where the day is 1 and nothing can clamp — and adding plain days reproduces the overflow |
| `isAfter`, `isBefore`, `isBetween` | **strict on both ends** — `date-fns` comparison, and `isBetween` is literally `_isAfter(v, start) && _isBefore(v, end)`, so `BETWEEN` is wrong |
| `getMilliseconds` | DuckDB's `millisecond` part includes the seconds (`5678`); the emission needs `% 1000` |
| the date getters | **UTC-based despite their names.** `getHours('…T03:04:05Z')` is `3` under `TZ=America/New_York`, not `22` |
| `dayofweek` | 0-for-Sunday in DuckDB, matching `getUTCDay` |
| `truncate` | `size` must be positive — the function rejects `0` |

## Not promoted, and why

| function | reason |
|---|---|
| `expm1`, `log1p` | `exp(x) - 1` and `ln(1 + x)` lose catastrophically for small `x` — `Math.expm1(1e-7)` differs from `exp(1e-7) - 1` in the 8th digit, far beyond ULP. They exist precisely to avoid that cancellation |
| `atan2` | takes its second operand from the value, not from an argument |
| `geoPointWithinRange` | it is **not a distance test.** `makeGeoCircle` builds a turf CIRCLE POLYGON — a 64-sided approximation by default — and runs point-in-polygon against it, so it under-approximates the circle between vertices. `ST_DWithin_Spheroid` is a true distance predicate and disagrees in exactly those gaps. Matching would mean generating the same 64-gon |
| the shape predicates — `geoContains`, `geoWithin`, `geoIntersects`, `geoDisjoint`, `geoRelation`, `geoContainsPoint` | arbitrary-polygon algorithms, plus the boundary difference below. Needs a decision about whether turf-parity or OGC-correctness is the goal |
| `isFuture`, `isPast`, `isToday`, `isTomorrow`, `isYesterday` | they read `Date.now()` per ROW, and the day-boundary ones are local-time. SQL would use one plan-time constant or `now()` — arguably better, but a behaviour change, and `isToday`'s boundary would come from the DuckDB session zone rather than the Node process zone |
| `timezoneToOffset` | `tzOffset(zone)` with no date, so it means "right now" — non-deterministic in the same way |
| ~~`isMACAddress`~~ | **PROMOTED.** DuckDB having no MAC type is irrelevant - the function is five regexes over a string. The backreference that made this look impossible is `validator`'s, and `core-utils` does not call it |
| ~~`ipToInt`, `intToIP`~~ | **both PROMOTED for IPv4**, with the UDF kept for v6 - there is no `inet_aton`/`inet_ntoa` and no cast between `INET` and a number, but `string_split` plus arithmetic is exact in both directions. IPv6 still needs 128 UNSIGNED bits and `HUGEINT` is signed |
| ~~`isBase64`~~ | **PROMOTED with the CORRECT behaviour, not the current one.** `core-utils` wraps it in a lossy UTF-8 ROUND TRIP — `Buffer.from(x,'base64').toString('utf8')` re-encoded must equal the input — which rejects `'abcd'` (valid to `validator`) and mangles any byte sequence that is not valid UTF-8. The emission implements RFC 4648 instead — see known-defects DF9. Found by the gate after the emission was written from `validator`'s source; the lesson is to read `core-utils`, not just the library it calls |
| `isURL` | **the only one of that group that is genuinely `validator`.** 13 options, procedural parsing of protocol, auth, host, port, path and fragment, a TLD requirement and a 2084-character length cap. `isEmail`, `isCountryCode`, `isMIMEType` and `isPhoneNumberLike` were listed here with it and are now promoted - see "How to add one" |
| `isPostalCode` | a table of ~60 per-country patterns, and `'any'` tries all of them. Mechanical rather than subtle, so this is a question of size, not of risk - unlike `isURL` |
| `isISDN`, `toISDN` | `awesome-phonenumber`. These two really are libphonenumber |
