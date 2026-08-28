# DataFrame → DuckDB semantic parity

**Generated**, not hand-written. Every cell below is the result of running the same input through
data-mate's built `dist` and through DuckDB and diffing. Regenerate with
`TZ=UTC node gen/index.mjs`.

> ## SUPERSEDED AS A GAP ANALYSIS (2026-08-21) — read this before citing anything below
>
> **The §2 matrix and §4.2 gap list understate what SQL can do, by a lot.** They record what a
> candidate expression was found for BY INSPECTION in mid-August. Since then the emissions were
> built and gated, and:
>
> - **41 of the 53 functions this document calls "no DuckDB equivalent" now run as SQL**, verified
>   byte-equal to their own UDF over an adversarial battery by `test/duck-frame/sql-emission-spec.ts`.
> - **13 of the 17 marked "APPROXIMATION" are promoted with EXACT emissions**, including `isEmail`,
>   `isMACAddress`, `formatDate` and `toDate`.
> - §4.2's own claim that "**None of these are guesses** — a candidate was only omitted where none
>   was found" is the thing to distrust. "None was found" meant none was found by reading; several
>   notes describe **a different implementation than the one `core-utils` actually calls** —
>   `isPhoneNumberLike` was recorded as "phone-number parsing via awesome-phonenumber" and never
>   touches it, `isCountryCode` as an "ISO-3166 table lookup" when it is one 249-entry `IN` list,
>   `entropy` as having "no scalar SQL form" when it is a `list_reduce`.
>
> **`docs/sql-emission.md` is the authority on what runs as SQL** — 188 of 205 as of 2026-08-21 —
> and `HANDOFF.md` NEXT STEPS item 2 on what is left. Two parts of THIS document are still good and
> were not affected: **§1 the type/coercion matrix** and **§3 frame semantics**, which measure
> DuckDB's own casts and ordering rather than judging portability.

> **READ THIS BEFORE CITING A DIVERGENCE (2026-08-18).** Every divergence below was measured against
> DuckDB's **default cast** - `TRY_CAST(v AS TINYINT)`, `TRY_CAST(v AS INET)`,
> `TRY_CAST(v AS TIMESTAMPTZ)`. It establishes that DuckDB's casts differ from data-mate's coercion.
> **It does NOT establish that SQL cannot express data-mate's semantics**, and this table has been
> cited that way. Re-tested with deliberate expressions (`tools/probe/sql-semantics.mjs`): **13 of 13
> previously-divergent inputs match data-mate exactly** using `trunc`, `regexp_extract`, `epoch_ms`,
> `try_strptime(v, [formats])`, and `error()` for a THROW. See `HANDOFF.md` §THE 2026-08-18
> MEASUREMENTS.

| | |
|---|---|
| data-mate functions | 205 |
| DuckDB | v1.5.5 via `@duckdb/node-api` |
| extensions loaded | autocomplete, core_functions, icu, inet, json, parquet, spatial — **loaded BY THIS GENERATOR, not by default.** Measured 2026-08-21: only `autocomplete`, `core_functions`, `icu`, `json` and `parquet` load on their own; `inet` autoloads on first use and `spatial` does NOT autoload at all |
| session timezone | `UTC` (pinned — see §3) |

## Why this document exists

`DataFrame` and the QPL engine are being frozen. The 205 functions are a **list of behaviours**, and
v2 is free to implement the behaviour rather than call the function — but only if the behaviour is
written down first. Right now it exists solely as the implementation, which is about to stop being the
reference. This is the extraction.

**How to read the parity column**

| | |
|---|---|
| ✅ exact | every input in the battery produced an identical result |
| ⚠️ drift | a candidate exists and runs, but results differ on the listed inputs |
| — none | no single-expression equivalent found. **Not a guess** — an omission |
| — array | operates on an array-valued field; not exercised by the scalar battery |
| — untestable | every battery input already diverges at the coercion layer |
| ⓐ | the candidate is an *approximation*, not a translation |

Inputs where the two engines already disagree at the **coercion** layer are excluded from the function
diff and counted separately, so §2 reports drift attributable to the function rather than re-reporting
§1 once per function.

---

## 1. Type and coercion matrix


Per `FieldType`: how data-mate stores it, the candidate DuckDB type, and how the two differ over an
adversarial battery. "throws" counts inputs data-mate rejects outright.

**The contract differs before any individual value does:** data-mate **throws on the first bad value
in a batch**, rejecting the whole batch. `TRY_CAST` nulls that value and continues. Every ingest
path is affected by this choice.


| FieldType | internal Vector | DuckDB candidate | n | agree | diverge | mate throws |
|---|---|---|---|---|---|---|
| `Keyword` | String | `VARCHAR` | 25 | 25 | 0 | 0 |
| `Text` | String | `VARCHAR` | 25 | 25 | 0 | 0 |
| `String` | String | `VARCHAR` | 25 | 25 | 0 | 0 |
| `Byte` | Int | `TINYINT` | 29 | 21 | **8** | 10 |
| `Short` | Int | `SMALLINT` | 29 | 21 | **8** | 10 |
| `Integer` | Int | `INTEGER` | 29 | 18 | **11** | 7 |
| `Long` | BigInt | `BIGINT` | 29 | 21 | **8** | 7 |
| `Float` | Float | `DOUBLE` | 29 | 23 | **6** | 5 |
| `Double` | Float | `DOUBLE` | 29 | 24 | **5** | 2 |
| `Number` | Float | `DOUBLE` | 29 | 24 | **5** | 2 |
| `Boolean` | Boolean | `BOOLEAN` | 17 | 14 | **3** | 5 |
| `Date` | Date | `TIMESTAMPTZ` | 17 | 12 | **5** | 2 |
| `IP` | IP | `INET` | 18 | 15 | **3** | 7 |
| `IPRange` | IPRange | `INET` | 14 | 10 | **4** | 7 |
| `Binary` | Any (BinaryVector is never constructed) | `BLOB` | — | — | — | 2 |
| `GeoPoint` | GeoPoint | `STRUCT(lat DOUBLE, lon DOUBLE) or POINT_2D` | 12 | 8 | **4** | 2 |
| `GeoJSON` | GeoJSON | `GEOMETRY (spatial ext)` | — | — | — | 5 |
| `Boundary` | GeoBoundary | `LIST(STRUCT(lat,lon))` | — | — | — | 4 |
| `Object` | Object | `STRUCT (known children) or JSON` | — | — | — | 6 |
| `Tuple` | Tuple | `STRUCT with positional keys` | — | — | — | 11 |
| `Any` | Any | `VARIANT` | — | — | — | 0 |


_70 divergences across all typed batteries._


### Divergence detail

#### `Byte` — 8 divergences

_cast tested: `TRY_CAST(v AS TINYINT)`_

| input | data-mate | DuckDB |
|---|---|---|
| `12.7` | `12` | `13` |
| `1e3` | `1` | `null` |
| `0x10` | `0` | `16` |
| `0b11` | `0` | `3` |
| `0o17` | `0` | `null` |
| `.5` | **THROW** | `1` |
| `2.5` | `2` | `3` |
| `-2.5` | `-2` | `-3` |

#### `Short` — 8 divergences

_cast tested: `TRY_CAST(v AS SMALLINT)`_

| input | data-mate | DuckDB |
|---|---|---|
| `12.7` | `12` | `13` |
| `1e3` | `1` | `1000` |
| `0x10` | `0` | `16` |
| `0b11` | `0` | `3` |
| `0o17` | `0` | `null` |
| `.5` | **THROW** | `1` |
| `2.5` | `2` | `3` |
| `-2.5` | `-2` | `-3` |

#### `Integer` — 11 divergences

_cast tested: `TRY_CAST(v AS INTEGER)`_

| input | data-mate | DuckDB |
|---|---|---|
| `12.7` | `12` | `13` |
| `1e3` | `1` | `1000` |
| `0x10` | `0` | `16` |
| `0b11` | `0` | `3` |
| `0o17` | `0` | `null` |
| `.5` | **THROW** | `1` |
| `2.5` | `2` | `3` |
| `-2.5` | `-2` | `-3` |
| `1000000000000000` | `1000000000000000` | `null` |
| `-1000000000000000` | `-1000000000000000` | `null` |
| `99999.999` | `99999` | `100000` |

#### `Long` — 8 divergences

_cast tested: `TRY_CAST(v AS BIGINT)`_

| input | data-mate | DuckDB |
|---|---|---|
| `12.7` | `12` | `13` |
| `1e3` | **THROW** | `1000` |
| `0o17` | `15` | `null` |
| `999999999999999999999` | `999999999999999999999` | `null` |
| `.5` | **THROW** | `1` |
| `2.5` | `2` | `3` |
| `-2.5` | `-2` | `-3` |
| `99999.999` | `99999` | `100000` |

#### `Float` — 6 divergences

_cast tested: `TRY_CAST(v AS DOUBLE)`_

| input | data-mate | DuckDB |
|---|---|---|
| `0x10` | `0` | `null` |
| `0b11` | `0` | `null` |
| `0o17` | `0` | `null` |
| `Infinity` | **THROW** | `Infinity` |
| `-Infinity` | **THROW** | `-Infinity` |
| `NaN` | **THROW** | `NaN` |

#### `Double` — 5 divergences

_cast tested: `TRY_CAST(v AS DOUBLE)`_

| input | data-mate | DuckDB |
|---|---|---|
| `0x10` | `16` | `null` |
| `0b11` | `3` | `null` |
| `0o17` | `15` | `null` |
| `""` | `0` | `null` |
| `NaN` | **THROW** | `NaN` |

#### `Number` — 5 divergences

_cast tested: `TRY_CAST(v AS DOUBLE)`_

| input | data-mate | DuckDB |
|---|---|---|
| `0x10` | `16` | `null` |
| `0b11` | `3` | `null` |
| `0o17` | `15` | `null` |
| `""` | `0` | `null` |
| `NaN` | **THROW** | `NaN` |

#### `Boolean` — 3 divergences

_cast tested: `TRY_CAST(v AS BOOLEAN)`_

| input | data-mate | DuckDB |
|---|---|---|
| `y` | **THROW** | `true` |
| `n` | **THROW** | `false` |
| `""` | `false` | `null` |

#### `Date` — 5 divergences

_cast tested: `strftime(TRY_CAST(v AS TIMESTAMPTZ),'%Y-%m-%dT%H:%M:%S.%g') || 'Z'`_

| input | data-mate | DuckDB |
|---|---|---|
| `1710028800000` | `2024-03-10T00:00:00.000Z` | `null` |
| `1710028800` | `2024-03-10T00:00:00.000Z` | `null` |
| `0` | `2000-01-01T00:00:00.000Z` | `null` |
| `Mar 10 2024` | `2024-03-10T00:00:00.000Z` | `null` |
| `03/10/2024` | `2024-03-10T00:00:00.000Z` | `null` |

#### `IP` — 3 divergences

_cast tested: `TRY_CAST(v AS INET)::VARCHAR`_

| input | data-mate | DuckDB |
|---|---|---|
| `01.02.03.04` | **THROW** | `1.2.3.4` |
| `1.2.3.4/24` | **THROW** | `1.2.3.4/24` |
| `10.0.0.0/8` | **THROW** | `10.0.0.0/8` |

#### `IPRange` — 4 divergences

_cast tested: `TRY_CAST(v AS INET)::VARCHAR`_

| input | data-mate | DuckDB |
|---|---|---|
| `::1/128` | `::1/128` | `::1` |
| `1.2.3.4` | **THROW** | `1.2.3.4` |
| `10.0.0.1` | **THROW** | `10.0.0.1` |
| `::1` | **THROW** | `::1` |

#### `Binary` — no single-expression equivalent

Target representation: `BLOB`. Not diffed; data-mate's acceptance contract recorded instead.

**Accepted (7)**

| input | data-mate stores |
|---|---|
| `abc` | `abc` |
| `YWJj` | `YWJj` |
| `""` | `""` |
| `{"type":"Buffer","data":[97,98,99]}` | `YWJj` |
| `null` | `null` |
| `null` | `null` |
| `undefined` | `null` |

**Rejected (2)**

| input | error |
|---|---|
| `{"0":1,"1":2,"2":3}` | `Invalid input given, expected string or buffer, got Uint8Array` |
| `123` | `Invalid input given, expected string or buffer, got Number` |

#### `GeoPoint` — 4 divergences

_cast tested: `CASE WHEN v IS NULL THEN NULL ELSE {'lat': TRY_CAST(split_part(v,',',1) AS DOUBLE), 'lon': TRY_CAST(split_part(v,',',2) AS DOUBLE)} END`_

| input | data-mate | DuckDB |
|---|---|---|
| `{"lat":40,"lon":-105}` | `{"lat":40,"lon":-105}` | `{"lat":null,"lon":null}` |
| `[-105,40]` | `{"lat":40,"lon":-105}` | `{"lat":-105,"lon":40}` |
| `not a point` | **THROW** | `{"lat":null,"lon":null}` |
| `""` | **THROW** | `{"lat":null,"lon":null}` |

#### `GeoJSON` — no single-expression equivalent

Target representation: `GEOMETRY (spatial ext)`. Not diffed; data-mate's acceptance contract recorded instead.

**Accepted (5)**

| input | data-mate stores |
|---|---|
| `{"type":"Point","coordinates":[1,2]}` | `{"coordinates":[1,2],"type":"Point"}` |
| `{"type":"Polygon","coordinates":[[[0,0],[0,1],[1,1],[0,0]]]}` | `{"coordinates":[[[0,0],[0,1],[1,1],[0,0]]],"type":"Polygon"}` |
| `{"type":"MultiPolygon","coordinates":[[[[0,0],[0,1],[1,1]…` | `{"coordinates":[[[[0,0],[0,1],[1,1],[0,0]]]],"type":"Mult…` |
| `null` | `null` |
| `undefined` | `null` |

**Rejected (5)**

| input | error |
|---|---|
| `{"type":"Point","coordinates":[1,2]}` | `Cannot convert "{\"type\":\"Point\",\"coordinates\":[1,2]}" to valid g` |
| `{"type":"Nonsense","coordinates":[]}` | `Cannot convert {"type":"Nonsense","coordinates":[]} to valid geoJSON` |
| `{"type":"Point"}` | `Cannot convert {"type":"Point"} to valid geoJSON` |
| `not geojson` | `Cannot convert "not geojson" to valid geoJSON` |
| `""` | `Cannot convert "" to valid geoJSON` |

#### `Boundary` — no single-expression equivalent

Target representation: `LIST(STRUCT(lat,lon))`. Not diffed; data-mate's acceptance contract recorded instead.

**Accepted (5)**

| input | data-mate stores |
|---|---|
| `[[10,10],[20,20]]` | `[{"lat":10,"lon":10},{"lat":20,"lon":20}]` |
| `[{"lat":10,"lon":10},{"lat":20,"lon":20}]` | `[{"lat":10,"lon":10},{"lat":20,"lon":20}]` |
| `["10,10","20,20"]` | `[{"lat":10,"lon":10},{"lat":20,"lon":20}]` |
| `null` | `null` |
| `undefined` | `null` |

**Rejected (4)**

| input | error |
|---|---|
| `[[10,10]]` | `Geo Boundary requires two Geo Points, got 1` |
| `[]` | `Geo Boundary requires two Geo Points, got 0` |
| `not a boundary` | `Geo Boundary requires an array, got not a boundary (String)` |
| `""` | `Geo Boundary requires an array, got  (String)` |

#### `Object` — no single-expression equivalent

Target representation: `STRUCT (known children) or JSON`. Not diffed; data-mate's acceptance contract recorded instead.

**Accepted (7)**

| input | data-mate stores |
|---|---|
| `{}` | `{}` |
| `{"a":1}` | `{"a":1}` |
| `{"a":1,"b":"x"}` | `{"a":1,"b":"x"}` |
| `{"nested":{"deep":true}}` | `{"nested":{"deep":true}}` |
| `{"a":null}` | `{"a":null}` |
| `null` | `null` |
| `undefined` | `null` |

**Rejected (6)**

| input | error |
|---|---|
| `{"a":1}` | `Expected {"a":1} (String) to be an object` |
| `[]` | `Expected [] (String) to be an object` |
| `not json` | `Expected not json (String) to be an object` |
| `""` | `Expected  (String) to be an object` |
| `[]` | `Expected  (Array) to be an object` |
| `[1,2]` | `Expected 1,2 (Array) to be an object` |

#### `Tuple` — no single-expression equivalent

Target representation: `STRUCT with positional keys`. Not diffed; data-mate's acceptance contract recorded instead.

**Accepted (0)**

_(none)_

**Rejected (11)**

| input | error |
|---|---|
| `[1,"a",true]` | `Tuple field types require at least one field` |
| `[]` | `Tuple field types require at least one field` |
| `[null]` | `Tuple field types require at least one field` |
| `[1]` | `Tuple field types require at least one field` |
| `[1,"a",true,"extra"]` | `Tuple field types require at least one field` |
| `[1,"a",true]` | `Tuple field types require at least one field` |
| `{"0":1,"1":"a"}` | `Tuple field types require at least one field` |
| `not a tuple` | `Tuple field types require at least one field` |
| `""` | `Tuple field types require at least one field` |
| `null` | `Tuple field types require at least one field` |
| `undefined` | `Tuple field types require at least one field` |

#### `Any` — no single-expression equivalent

Target representation: `VARIANT`. Not diffed; data-mate's acceptance contract recorded instead.

**Accepted (12)**

| input | data-mate stores |
|---|---|
| `1` | `1` |
| `str` | `str` |
| `true` | `true` |
| `null` | `null` |
| `{"a":1}` | `{"a":1}` |
| `[1,2]` | `[1,2]` |
| `1.5` | `1.5` |
| `0` | `0` |
| `""` | `""` |
| `[]` | `[]` |
| `null` | `null` |
| `undefined` | `null` |

**Rejected (0)**

_(none)_


---

## 2. Function behaviour matrix (205)


| | |
|---|---|
| exact | **57** |
| drift | **92** |
| no equivalent / array / untestable | **56** |
| of which approximations | 17 |

Two conventions that are not obvious from the source and that any translation must reproduce:

1. **Validators return the value or `null`, not a boolean.** Validation is implemented as a nulling
   transform (`validatorTransformFN`), so the SQL form is
   `CASE WHEN <pred> THEN <value> ELSE NULL END`, not `<pred>`.
2. **`SET TimeZone='UTC'` is mandatory.** At any other session timezone every `TIMESTAMPTZ`
   operation silently shifts its result.


### BOOLEAN (3) — 2 drift, 1 exact
| function | kind | parity | behaviour | DuckDB candidate |
|---|---|---|---|---|
| `isBoolean` | V | ⚠️ drift (10/15) | true only for actual booleans | `lower(v) IN ('true','false')` |
| `isBooleanLike` | V | ✅ exact | accepts truthy/falsy strings and empty | `lower(v) IN ('true','false','yes','no','1','0','')` |
| `toBoolean` | T | ⚠️ drift (10/15) | permissive coercion; empty string is false, unknown strings throw | `CASE WHEN lower(v) IN ('true','yes','1') THEN true WHEN lower(v) IN ('false','no','0','') ` |

<details>
<summary>BOOLEAN divergence detail (2)</summary>

##### `isBoolean`
| input | data-mate | DuckDB |
|---|---|---|
| `true` | `null` | `true` |
| `TRUE` | `null` | `TRUE` |
| `True` | `null` | `True` |
| `false` | `null` | `false` |
| `FALSE` | `null` | `FALSE` |

##### `toBoolean`
| input | data-mate | DuckDB |
|---|---|---|
| `y` | `true` | `null` |
| `n` | `true` | `null` |
| `on` | `true` | `null` |
| `off` | `true` | `null` |
| `abc` | `true` | `null` |

</details>

### DATE (56) — 34 drift, 7 exact, 15 no-equivalent
| function | kind | parity | behaviour | DuckDB candidate |
|---|---|---|---|---|
| `addToDate` | T | ⚠️ drift (10/22) | add an interval | `CASE WHEN TRY_CAST(v AS TIMESTAMPTZ) + INTERVAL 3 DAY IS NULL THEN NULL ELSE strftime(TRY_` |
| `formatDate` | T | ⚠️ drift (10/22) ⓐ | format via a strftime-style pattern | `strftime(TRY_CAST(v AS TIMESTAMPTZ), '%Y/%m/%d')` |
| `getDate` | T | ⚠️ drift (11/22) | day of month | `date_part('day', TRY_CAST(v AS TIMESTAMPTZ))` |
| `getHours` | T | ⚠️ drift (11/22) | hour 0-23 | `date_part('hour', TRY_CAST(v AS TIMESTAMPTZ))` |
| `getMilliseconds` | T | ⚠️ drift (11/22) | millisecond component | `date_part('millisecond', TRY_CAST(v AS TIMESTAMPTZ)) % 1000` |
| `getMinutes` | T | ⚠️ drift (11/22) | minute | `date_part('minute', TRY_CAST(v AS TIMESTAMPTZ))` |
| `getMonth` | T | ⚠️ drift (11/22) | month 1-12 | `date_part('month', TRY_CAST(v AS TIMESTAMPTZ))` |
| `getSeconds` | T | ⚠️ drift (11/22) | second | `date_part('second', TRY_CAST(v AS TIMESTAMPTZ))` |
| `getTimeBetween` | T | ⚠️ drift (11/22) | difference in a named unit | `date_diff('minute', TRY_CAST(v AS TIMESTAMPTZ), '2024-03-11T00:00:00Z'::TIMESTAMPTZ)` |
| `getTimezoneOffset` | T | ⚠️ drift (12/22) ⓐ | offset in minutes | `date_part('timezone', TRY_CAST(v AS TIMESTAMPTZ)) / 60` |
| `getUTCDate` | T | ⚠️ drift (11/22) | UTC day of month | `date_part('day', TRY_CAST(v AS TIMESTAMPTZ) AT TIME ZONE 'UTC')` |
| `getUTCHours` | T | ⚠️ drift (11/22) | UTC hour | `date_part('hour', TRY_CAST(v AS TIMESTAMPTZ) AT TIME ZONE 'UTC')` |
| `getUTCMinutes` | T | ⚠️ drift (11/22) | UTC minute | `date_part('minute', TRY_CAST(v AS TIMESTAMPTZ) AT TIME ZONE 'UTC')` |
| `getUTCMonth` | T | ⚠️ drift (11/22) | UTC month | `date_part('month', TRY_CAST(v AS TIMESTAMPTZ) AT TIME ZONE 'UTC')` |
| `getUTCYear` | T | ⚠️ drift (11/22) | UTC year | `date_part('year', TRY_CAST(v AS TIMESTAMPTZ) AT TIME ZONE 'UTC')` |
| `getYear` | T | ⚠️ drift (11/22) | local year; identical to UTC when TimeZone=UTC | `date_part('year', TRY_CAST(v AS TIMESTAMPTZ))` |
| `isAfter` | V | ⚠️ drift (20/22) | after a given date | `TRY_CAST(v AS TIMESTAMPTZ) > '2024-01-01T00:00:00Z'::TIMESTAMPTZ` |
| `isBefore` | V | ⚠️ drift (12/22) | before a given date | `TRY_CAST(v AS TIMESTAMPTZ) < '2024-12-31T00:00:00Z'::TIMESTAMPTZ` |
| `isBetween` | V | ✅ exact | within a range | `TRY_CAST(v AS TIMESTAMPTZ) BETWEEN '2024-01-01T00:00:00Z'::TIMESTAMPTZ AND '2024-12-31T00:` |
| `isDate` | V | ⚠️ drift (9/22) | parses as a date, optionally against a format | `TRY_CAST(v AS TIMESTAMPTZ) IS NOT NULL` |
| `isEpoch` | V | ⚠️ drift (15/22) ⓐ | looks like epoch seconds | `TRY_CAST(v AS BIGINT) IS NOT NULL AND TRY_CAST(v AS BIGINT) BETWEEN 0 AND 9999999999` |
| `isEpochMillis` | V | ⚠️ drift (2/22) ⓐ | looks like epoch milliseconds | `TRY_CAST(v AS BIGINT) IS NOT NULL AND TRY_CAST(v AS BIGINT) > 9999999999` |
| `isFriday` | V | ⚠️ drift (21/22) | is a Friday | `dayofweek(TRY_CAST(v AS TIMESTAMPTZ)) = 5` |
| `isFuture` | V | — none | relative to now; non-deterministic | — |
| `isISO8601` | V | ⚠️ drift (20/22) | parses as ISO8601 | `TRY_CAST(v AS TIMESTAMPTZ) IS NOT NULL` |
| `isLeapYear` | V | ✅ exact | gregorian leap year | `(date_part('year',TRY_CAST(v AS TIMESTAMPTZ)) % 4 = 0 AND date_part('year',TRY_CAST(v AS T` |
| `isMonday` | V | ✅ exact | is a Monday | `dayofweek(TRY_CAST(v AS TIMESTAMPTZ)) = 1` |
| `isPast` | V | — none | relative to now; non-deterministic | — |
| `isSaturday` | V | ✅ exact | is a Saturday | `dayofweek(TRY_CAST(v AS TIMESTAMPTZ)) = 6` |
| `isSunday` | V | ✅ exact | is a Sunday | `dayofweek(TRY_CAST(v AS TIMESTAMPTZ)) = 0` |
| `isThursday` | V | ⚠️ drift (15/22) | is a Thursday | `dayofweek(TRY_CAST(v AS TIMESTAMPTZ)) = 4` |
| `isToday` | V | — none | relative to current date; excluded from parity as non-deterministic | — |
| `isTomorrow` | V | — none | relative to current date; non-deterministic | — |
| `isTuesday` | V | ⚠️ drift (21/22) | is a Tuesday | `dayofweek(TRY_CAST(v AS TIMESTAMPTZ)) = 2` |
| `isWednesday` | V | ⚠️ drift (21/22) | is a Wednesday | `dayofweek(TRY_CAST(v AS TIMESTAMPTZ)) = 3` |
| `isWeekday` | V | ⚠️ drift (12/22) | Monday to Friday | `dayofweek(TRY_CAST(v AS TIMESTAMPTZ)) BETWEEN 1 AND 5` |
| `isWeekend` | V | ✅ exact | Saturday or Sunday | `dayofweek(TRY_CAST(v AS TIMESTAMPTZ)) IN (0,6)` |
| `isYesterday` | V | — none | relative to current date; non-deterministic | — |
| `lookupTimezone` | T | — none | lat/lon to timezone name; requires a timezone geo database DuckDB does not ship | — |
| `setDate` | T | — none | replace day-of-month; overflow semantics differ from JS Date | — |
| `setHours` | T | — none | replace hour; composition works but rollover semantics unverified | — |
| `setMilliseconds` | T | — none | as setHours | — |
| `setMinutes` | T | — none | as setHours | — |
| `setMonth` | T | — none | replace month; make_timestamptz composition is expressible but day-overflow semantics differ | — |
| `setSeconds` | T | — none | as setHours | — |
| `setTimezone` | T | — none | attaches a fixed offset to the stored DateTuple; data-mate keeps the offset, TIMESTAMPTZ normalizes to UTC | — |
| `setYear` | T | ⚠️ drift (11/22) | replace the year | `CASE WHEN make_timestamptz(2030, date_part('month',TRY_CAST(v AS TIMESTAMPTZ))::BIGINT, da` |
| `subtractFromDate` | T | ✅ exact | subtract an interval | `CASE WHEN TRY_CAST(v AS TIMESTAMPTZ) - INTERVAL 2 MONTH IS NULL THEN NULL ELSE strftime(TR` |
| `timezoneToOffset` | T | — none | maps a zone name to an offset without a date; needs a reference instant | — |
| `toDailyDate` | T | ⚠️ drift (10/22) | truncate to day | `CASE WHEN date_trunc('day', TRY_CAST(v AS TIMESTAMPTZ)) IS NULL THEN NULL ELSE strftime(da` |
| `toDate` | T | ⚠️ drift (20/22) ⓐ | parse with an explicit format | `CASE WHEN try_strptime(v, '%Y-%m-%d') IS NULL THEN NULL ELSE strftime(try_strptime(v, '%Y-` |
| `toHourlyDate` | T | ⚠️ drift (10/22) | truncate to hour | `CASE WHEN date_trunc('hour', TRY_CAST(v AS TIMESTAMPTZ)) IS NULL THEN NULL ELSE strftime(d` |
| `toMonthlyDate` | T | ⚠️ drift (10/22) | truncate to month | `CASE WHEN date_trunc('month', TRY_CAST(v AS TIMESTAMPTZ)) IS NULL THEN NULL ELSE strftime(` |
| `toTimeZone` | T | ⚠️ drift (11/22) ⓐ | convert to a named zone | `CASE WHEN timezone('America/Denver', TRY_CAST(v AS TIMESTAMPTZ)) IS NULL THEN NULL ELSE st` |
| `toTimeZoneUsingLocation` | T | — none | as lookupTimezone | — |
| `toYearlyDate` | T | ⚠️ drift (10/22) | truncate to year | `CASE WHEN date_trunc('year', TRY_CAST(v AS TIMESTAMPTZ)) IS NULL THEN NULL ELSE strftime(d` |

<details>
<summary>DATE divergence detail (34)</summary>

##### `addToDate`
| input | data-mate | DuckDB |
|---|---|---|
| `12` | `1970-01-04T00:00:00.012Z` | `null` |
| `-0` | `1970-01-04T00:00:00.000Z` | `null` |
| `1e3` | `1970-01-04T00:00:01.000Z` | `null` |
| ` 7 ` | `1970-01-04T00:00:00.007Z` | `null` |
| `Infinity` | **THROW** | `infinityZ` |
| `-Infinity` | **THROW** | `-infinityZ` |
| `5.` | `1970-01-04T00:00:00.005Z` | `null` |
| `0` | `1970-01-04T00:00:00.000Z` | `null` |
| `1` | `1970-01-04T00:00:00.001Z` | `null` |
| `-1` | `1970-01-03T23:59:59.999Z` | `null` |
| `1000000000000000` | `+033658-09-30T01:46:40.000Z` | `null` |
| `-1000000000000000` | `-029719-04-08T22:13:20.000Z` | `null` |

##### `formatDate`
| input | data-mate | DuckDB |
|---|---|---|
| `12` | `1970/01/01` | `null` |
| `-0` | `1970/01/01` | `null` |
| `1e3` | `1970/01/01` | `null` |
| ` 7 ` | `1970/01/01` | `null` |
| `Infinity` | **THROW** | `infinity` |
| `-Infinity` | **THROW** | `-infinity` |
| `5.` | `1970/01/01` | `null` |
| `0` | `1970/01/01` | `null` |
| `1` | `1970/01/01` | `null` |
| `-1` | `1969/12/31` | `null` |
| `1000000000000000` | `33658/09/27` | `null` |
| `-1000000000000000` | `29720/04/05` | `null` |

##### `getDate`
| input | data-mate | DuckDB |
|---|---|---|
| `12` | `1` | `null` |
| `-0` | `1` | `null` |
| `1e3` | `1` | `null` |
| ` 7 ` | `1` | `null` |
| `999999999999999999999` | `NaN` | `null` |
| `5.` | `1` | `null` |
| `0` | `1` | `null` |
| `1` | `1` | `null` |
| `-1` | `31` | `null` |
| `1000000000000000` | `27` | `null` |
| `-1000000000000000` | `5` | `null` |

##### `getHours`
| input | data-mate | DuckDB |
|---|---|---|
| `12` | `0` | `null` |
| `-0` | `0` | `null` |
| `1e3` | `0` | `null` |
| ` 7 ` | `0` | `null` |
| `999999999999999999999` | `NaN` | `null` |
| `5.` | `0` | `null` |
| `0` | `0` | `null` |
| `1` | `0` | `null` |
| `-1` | `23` | `null` |
| `1000000000000000` | `1` | `null` |
| `-1000000000000000` | `22` | `null` |

##### `getMilliseconds`
| input | data-mate | DuckDB |
|---|---|---|
| `12` | `12` | `null` |
| `-0` | `0` | `null` |
| `1e3` | `0` | `null` |
| ` 7 ` | `7` | `null` |
| `999999999999999999999` | `NaN` | `null` |
| `5.` | `5` | `null` |
| `0` | `0` | `null` |
| `1` | `1` | `null` |
| `-1` | `999` | `null` |
| `1000000000000000` | `0` | `null` |
| `-1000000000000000` | `0` | `null` |

##### `getMinutes`
| input | data-mate | DuckDB |
|---|---|---|
| `12` | `0` | `null` |
| `-0` | `0` | `null` |
| `1e3` | `0` | `null` |
| ` 7 ` | `0` | `null` |
| `999999999999999999999` | `NaN` | `null` |
| `5.` | `0` | `null` |
| `0` | `0` | `null` |
| `1` | `0` | `null` |
| `-1` | `59` | `null` |
| `1000000000000000` | `46` | `null` |
| `-1000000000000000` | `13` | `null` |

##### `getMonth`
| input | data-mate | DuckDB |
|---|---|---|
| `12` | `1` | `null` |
| `-0` | `1` | `null` |
| `1e3` | `1` | `null` |
| ` 7 ` | `1` | `null` |
| `999999999999999999999` | `NaN` | `null` |
| `5.` | `1` | `null` |
| `0` | `1` | `null` |
| `1` | `1` | `null` |
| `-1` | `12` | `null` |
| `1000000000000000` | `9` | `null` |
| `-1000000000000000` | `4` | `null` |

##### `getSeconds`
| input | data-mate | DuckDB |
|---|---|---|
| `12` | `0` | `null` |
| `-0` | `0` | `null` |
| `1e3` | `1` | `null` |
| ` 7 ` | `0` | `null` |
| `999999999999999999999` | `NaN` | `null` |
| `5.` | `0` | `null` |
| `0` | `0` | `null` |
| `1` | `0` | `null` |
| `-1` | `59` | `null` |
| `1000000000000000` | `40` | `null` |
| `-1000000000000000` | `20` | `null` |

##### `getTimeBetween`
| input | data-mate | DuckDB |
|---|---|---|
| `12` | `28501919` | `null` |
| `-0` | `28501920` | `null` |
| `1e3` | `28501919` | `null` |
| ` 7 ` | `28501919` | `null` |
| `999999999999999999999` | `NaN` | `null` |
| `5.` | `28501919` | `null` |
| `0` | `28501920` | `null` |
| `1` | `28501919` | `null` |
| `-1` | `28501920` | `null` |
| `1000000000000000` | `-16638164746` | `null` |
| `-1000000000000000` | `16695168586` | `null` |

##### `getTimezoneOffset`
| input | data-mate | DuckDB |
|---|---|---|
| `12` | `-420` | `null` |
| `-0` | `-420` | `null` |
| `1e3` | `-420` | `null` |
| ` 7 ` | `-420` | `null` |
| `999999999999999999999` | `NaN` | `null` |
| `5.` | `-420` | `null` |
| `0` | `-420` | `null` |
| `1` | `-420` | `null` |
| `-1` | `-420` | `null` |
| `1000000000000000` | `-360` | `null` |

##### `getUTCDate`
| input | data-mate | DuckDB |
|---|---|---|
| `12` | `1` | `null` |
| `-0` | `1` | `null` |
| `1e3` | `1` | `null` |
| ` 7 ` | `1` | `null` |
| `999999999999999999999` | `NaN` | `null` |
| `5.` | `1` | `null` |
| `0` | `1` | `null` |
| `1` | `1` | `null` |
| `-1` | `31` | `null` |
| `1000000000000000` | `27` | `null` |
| `-1000000000000000` | `5` | `null` |

##### `getUTCHours`
| input | data-mate | DuckDB |
|---|---|---|
| `12` | `0` | `null` |
| `-0` | `0` | `null` |
| `1e3` | `0` | `null` |
| ` 7 ` | `0` | `null` |
| `999999999999999999999` | `NaN` | `null` |
| `5.` | `0` | `null` |
| `0` | `0` | `null` |
| `1` | `0` | `null` |
| `-1` | `23` | `null` |
| `1000000000000000` | `1` | `null` |
| `-1000000000000000` | `22` | `null` |

##### `getUTCMinutes`
| input | data-mate | DuckDB |
|---|---|---|
| `12` | `0` | `null` |
| `-0` | `0` | `null` |
| `1e3` | `0` | `null` |
| ` 7 ` | `0` | `null` |
| `999999999999999999999` | `NaN` | `null` |
| `5.` | `0` | `null` |
| `0` | `0` | `null` |
| `1` | `0` | `null` |
| `-1` | `59` | `null` |
| `1000000000000000` | `46` | `null` |
| `-1000000000000000` | `13` | `null` |

##### `getUTCMonth`
| input | data-mate | DuckDB |
|---|---|---|
| `12` | `1` | `null` |
| `-0` | `1` | `null` |
| `1e3` | `1` | `null` |
| ` 7 ` | `1` | `null` |
| `999999999999999999999` | `NaN` | `null` |
| `5.` | `1` | `null` |
| `0` | `1` | `null` |
| `1` | `1` | `null` |
| `-1` | `12` | `null` |
| `1000000000000000` | `9` | `null` |
| `-1000000000000000` | `4` | `null` |

##### `getUTCYear`
| input | data-mate | DuckDB |
|---|---|---|
| `12` | `1970` | `null` |
| `-0` | `1970` | `null` |
| `1e3` | `1970` | `null` |
| ` 7 ` | `1970` | `null` |
| `999999999999999999999` | `NaN` | `null` |
| `5.` | `1970` | `null` |
| `0` | `1970` | `null` |
| `1` | `1970` | `null` |
| `-1` | `1969` | `null` |
| `1000000000000000` | `33658` | `null` |
| `-1000000000000000` | `-29719` | `null` |

##### `getYear`
| input | data-mate | DuckDB |
|---|---|---|
| `12` | `1970` | `null` |
| `-0` | `1970` | `null` |
| `1e3` | `1970` | `null` |
| ` 7 ` | `1970` | `null` |
| `999999999999999999999` | `NaN` | `null` |
| `5.` | `1970` | `null` |
| `0` | `1970` | `null` |
| `1` | `1970` | `null` |
| `-1` | `1969` | `null` |
| `1000000000000000` | `33658` | `null` |
| `-1000000000000000` | `-29719` | `null` |

##### `isAfter`
| input | data-mate | DuckDB |
|---|---|---|
| `Infinity` | `null` | `Infinity` |
| `1000000000000000` | `1000000000000000` | `null` |

##### `isBefore`
| input | data-mate | DuckDB |
|---|---|---|
| `12` | `12` | `null` |
| `-0` | `0` | `null` |
| `1e3` | `1000` | `null` |
| ` 7 ` | `7` | `null` |
| `-Infinity` | `null` | `-Infinity` |
| `5.` | `5` | `null` |
| `0` | `0` | `null` |
| `1` | `1` | `null` |
| `-1` | `-1` | `null` |
| `-1000000000000000` | `-1000000000000000` | `null` |

##### `isDate`
| input | data-mate | DuckDB |
|---|---|---|
| `12` | `12` | `null` |
| `-0` | `0` | `null` |
| `1e3` | `1000` | `null` |
| ` 7 ` | `7` | `null` |
| `Infinity` | `null` | `Infinity` |
| `-Infinity` | `null` | `-Infinity` |
| `999999999999999999999` | `1e+21` | `null` |
| `5.` | `5` | `null` |
| `0` | `0` | `null` |
| `1` | `1` | `null` |
| `-1` | `-1` | `null` |
| `1000000000000000` | `1000000000000000` | `null` |

_…1 more_

##### `isEpoch`
| input | data-mate | DuckDB |
|---|---|---|
| `Infinity` | `Infinity` | `null` |
| `-Infinity` | `-Infinity` | `null` |
| `999999999999999999999` | `1e+21` | `null` |
| `-1` | `-1` | `null` |
| `-2.5` | `-2.5` | `null` |
| `1000000000000000` | `1000000000000000` | `null` |
| `-1000000000000000` | `-1000000000000000` | `null` |

##### `isEpochMillis`
| input | data-mate | DuckDB |
|---|---|---|
| `12` | `12` | `null` |
| `12.7` | `12.7` | `null` |
| `-0` | `0` | `null` |
| `1e3` | `1000` | `null` |
| ` 7 ` | `7` | `null` |
| `Infinity` | `Infinity` | `null` |
| `-Infinity` | `-Infinity` | `null` |
| `999999999999999999999` | `1e+21` | `null` |
| `.5` | `0.5` | `null` |
| `5.` | `5` | `null` |
| `0` | `0` | `null` |
| `1` | `1` | `null` |

_…8 more_

##### `isFriday`
| input | data-mate | DuckDB |
|---|---|---|
| `1000000000000000` | `1000000000000000` | `null` |

##### `isISO8601`
| input | data-mate | DuckDB |
|---|---|---|
| `Infinity` | `null` | `Infinity` |
| `-Infinity` | `null` | `-Infinity` |

##### `isThursday`
| input | data-mate | DuckDB |
|---|---|---|
| `12` | `12` | `null` |
| `-0` | `0` | `null` |
| `1e3` | `1000` | `null` |
| ` 7 ` | `7` | `null` |
| `5.` | `5` | `null` |
| `0` | `0` | `null` |
| `1` | `1` | `null` |

##### `isTuesday`
| input | data-mate | DuckDB |
|---|---|---|
| `-1000000000000000` | `-1000000000000000` | `null` |

##### `isWednesday`
| input | data-mate | DuckDB |
|---|---|---|
| `-1` | `-1` | `null` |

##### `isWeekday`
| input | data-mate | DuckDB |
|---|---|---|
| `12` | `12` | `null` |
| `-0` | `0` | `null` |
| `1e3` | `1000` | `null` |
| ` 7 ` | `7` | `null` |
| `5.` | `5` | `null` |
| `0` | `0` | `null` |
| `1` | `1` | `null` |
| `-1` | `-1` | `null` |
| `1000000000000000` | `1000000000000000` | `null` |
| `-1000000000000000` | `-1000000000000000` | `null` |

##### `setYear`
| input | data-mate | DuckDB |
|---|---|---|
| `12` | `2030-01-01T00:00:00.012Z` | `null` |
| `-0` | `2030-01-01T00:00:00.000Z` | `null` |
| `1e3` | `2030-01-01T00:00:01.000Z` | `null` |
| ` 7 ` | `2030-01-01T00:00:00.007Z` | `null` |
| `999999999999999999999` | `2030-01-01T00:00:00.000Z` | `null` |
| `5.` | `2030-01-01T00:00:00.005Z` | `null` |
| `0` | `2030-01-01T00:00:00.000Z` | `null` |
| `1` | `2030-01-01T00:00:00.001Z` | `null` |
| `-1` | `2030-12-31T23:59:59.999Z` | `null` |
| `1000000000000000` | `2030-09-27T01:46:40.000Z` | `null` |
| `-1000000000000000` | `2030-04-05T22:13:20.000Z` | `null` |

##### `toDailyDate`
| input | data-mate | DuckDB |
|---|---|---|
| `12` | `1970-01-01T00:00:00.000Z` | `null` |
| `-0` | `1970-01-01T00:00:00.000Z` | `null` |
| `1e3` | `1970-01-01T00:00:00.000Z` | `null` |
| ` 7 ` | `1970-01-01T00:00:00.000Z` | `null` |
| `Infinity` | **THROW** | `infinityZ` |
| `-Infinity` | **THROW** | `-infinityZ` |
| `5.` | `1970-01-01T00:00:00.000Z` | `null` |
| `0` | `1970-01-01T00:00:00.000Z` | `null` |
| `1` | `1970-01-01T00:00:00.000Z` | `null` |
| `-1` | `1969-12-31T00:00:00.000Z` | `null` |
| `1000000000000000` | `+033658-09-27T00:00:00.000Z` | `null` |
| `-1000000000000000` | `-029719-04-05T00:00:00.000Z` | `null` |

##### `toDate`
| input | data-mate | DuckDB |
|---|---|---|
| `Infinity` | **THROW** | `1900-01-01T00:00:00.000Z` |
| `-Infinity` | **THROW** | `1900-01-01T00:00:00.000Z` |

##### `toHourlyDate`
| input | data-mate | DuckDB |
|---|---|---|
| `12` | `1970-01-01T00:00:00.000Z` | `null` |
| `-0` | `1970-01-01T00:00:00.000Z` | `null` |
| `1e3` | `1970-01-01T00:00:00.000Z` | `null` |
| ` 7 ` | `1970-01-01T00:00:00.000Z` | `null` |
| `Infinity` | **THROW** | `infinityZ` |
| `-Infinity` | **THROW** | `-infinityZ` |
| `5.` | `1970-01-01T00:00:00.000Z` | `null` |
| `0` | `1970-01-01T00:00:00.000Z` | `null` |
| `1` | `1970-01-01T00:00:00.000Z` | `null` |
| `-1` | `1969-12-31T23:00:00.000Z` | `null` |
| `1000000000000000` | `+033658-09-27T01:00:00.000Z` | `null` |
| `-1000000000000000` | `-029719-04-05T22:00:00.000Z` | `null` |

##### `toMonthlyDate`
| input | data-mate | DuckDB |
|---|---|---|
| `12` | `1970-01-01T00:00:00.000Z` | `null` |
| `-0` | `1970-01-01T00:00:00.000Z` | `null` |
| `1e3` | `1970-01-01T00:00:00.000Z` | `null` |
| ` 7 ` | `1970-01-01T00:00:00.000Z` | `null` |
| `Infinity` | **THROW** | `infinityZ` |
| `-Infinity` | **THROW** | `-infinityZ` |
| `5.` | `1970-01-01T00:00:00.000Z` | `null` |
| `0` | `1970-01-01T00:00:00.000Z` | `null` |
| `1` | `1970-01-01T00:00:00.000Z` | `null` |
| `-1` | `1969-12-01T00:00:00.000Z` | `null` |
| `1000000000000000` | `+033658-09-01T00:00:00.000Z` | `null` |
| `-1000000000000000` | `-029719-04-01T00:00:00.000Z` | `null` |

##### `toTimeZone`
| input | data-mate | DuckDB |
|---|---|---|
| `12` | `1969-12-31T17:00:00.012-07:00` | `null` |
| `-0` | `1969-12-31T17:00:00.000-07:00` | `null` |
| `1e3` | `1969-12-31T17:00:01.000-07:00` | `null` |
| ` 7 ` | `1969-12-31T17:00:00.007-07:00` | `null` |
| `Infinity` | **THROW** | `infinityZ` |
| `-Infinity` | **THROW** | `-infinityZ` |
| `5.` | `1969-12-31T17:00:00.005-07:00` | `null` |
| `0` | `1969-12-31T17:00:00.000-07:00` | `null` |
| `1` | `1969-12-31T17:00:00.001-07:00` | `null` |
| `-1` | `1969-12-31T16:59:59.999-07:00` | `null` |
| `1000000000000000` | `+033658-09-26T19:46:40.000-06:00` | `null` |

##### `toYearlyDate`
| input | data-mate | DuckDB |
|---|---|---|
| `12` | `1970-01-01T00:00:00.000Z` | `null` |
| `-0` | `1970-01-01T00:00:00.000Z` | `null` |
| `1e3` | `1970-01-01T00:00:00.000Z` | `null` |
| ` 7 ` | `1970-01-01T00:00:00.000Z` | `null` |
| `Infinity` | **THROW** | `infinityZ` |
| `-Infinity` | **THROW** | `-infinityZ` |
| `5.` | `1970-01-01T00:00:00.000Z` | `null` |
| `0` | `1970-01-01T00:00:00.000Z` | `null` |
| `1` | `1970-01-01T00:00:00.000Z` | `null` |
| `-1` | `1969-01-01T00:00:00.000Z` | `null` |
| `1000000000000000` | `+033658-01-01T00:00:00.000Z` | `null` |
| `-1000000000000000` | `-029719-01-01T00:00:00.000Z` | `null` |

</details>

### GEO (15) — 9 drift, 4 no-equivalent, 2 exact
| function | kind | parity | behaviour | DuckDB candidate |
|---|---|---|---|---|
| `geoContains` | V | ⚠️ drift (6/8) | geometry contains the arg | `ST_Contains(ST_GeomFromGeoJSON(v), ST_Point(1, 2))` |
| `geoContainsPoint` | V | ⚠️ drift (6/8) | geometry contains a point | `ST_Contains(ST_GeomFromGeoJSON(v), ST_Point(1, 2))` |
| `geoDisjoint` | V | ✅ exact | geometries do not intersect | `ST_Disjoint(ST_GeomFromGeoJSON(v), ST_MakeEnvelope(-180,-90,180,90))` |
| `geoIntersects` | V | ⚠️ drift (4/8) | geometries intersect | `ST_Intersects(ST_GeomFromGeoJSON(v), ST_MakeEnvelope(-180,-90,180,90))` |
| `geoPointWithinRange` | V | ✅ exact ⓐ | within a distance of a point | `ST_DWithin_Spheroid(ST_GeomFromGeoJSON(v), ST_Point(-105, 40), 5000)` |
| `geoRelation` | V | — none | dispatches on a relation-name arg; ST_Relate is absent from this build, though the individual predicates exist | — |
| `geoWithin` | V | ⚠️ drift (4/8) | geometry within the arg | `ST_Within(ST_GeomFromGeoJSON(v), ST_MakeEnvelope(-180,-90,180,90))` |
| `inGeoBoundingBox` | V | ⚠️ drift (4/8) | inside a bounding box | `ST_Within(ST_GeomFromGeoJSON(v), ST_MakeEnvelope(-180,-90,180,90))` |
| `isGeoJSON` | V | ⚠️ drift (2/8) ⓐ | parses as GeoJSON | `TRY_CAST(v AS JSON) IS NOT NULL AND json_extract_string(v,'$.type') IS NOT NULL` |
| `isGeoPoint` | V | — none | accepts strings, [lon,lat] tuples and {lat,lon} objects; multi-shape, not one expression | — |
| `isGeoShapeMultiPolygon` | V | ⚠️ drift (7/8) | GeoJSON MultiPolygon | `ST_GeometryType(ST_GeomFromGeoJSON(v))::VARCHAR = 'MULTIPOLYGON'` |
| `isGeoShapePoint` | V | ⚠️ drift (6/8) | GeoJSON Point | `ST_GeometryType(ST_GeomFromGeoJSON(v))::VARCHAR = 'POINT'` |
| `isGeoShapePolygon` | V | ⚠️ drift (7/8) | GeoJSON Polygon | `ST_GeometryType(ST_GeomFromGeoJSON(v))::VARCHAR = 'POLYGON'` |
| `toGeoJSON` | T | — none | accepts points/boundaries and emits GeoJSON; multi-shape input | — |
| `toGeoPoint` | T | — none | parses several point encodings into {lat,lon} | — |

<details>
<summary>GEO divergence detail (9)</summary>

##### `geoContains`
| input | data-mate | DuckDB |
|---|---|---|
| `{"type":"Point","coordinates":[1,2]}` | `null` | `{"type":"Point","coordinates":[1,2]}` |
| `{"type":"Point","coordinates":[1,2]}` | `null` | `{"type":"Point","coordinates":[1,2]}` |

##### `geoContainsPoint`
| input | data-mate | DuckDB |
|---|---|---|
| `{"type":"Point","coordinates":[1,2]}` | `null` | `{"type":"Point","coordinates":[1,2]}` |
| `{"type":"Point","coordinates":[1,2]}` | `null` | `{"type":"Point","coordinates":[1,2]}` |

##### `geoIntersects`
| input | data-mate | DuckDB |
|---|---|---|
| `{"type":"Point","coordinates":[1,2]}` | `null` | `{"type":"Point","coordinates":[1,2]}` |
| `{"type":"Polygon","coordinates":[[[0,0],[0,1],[1,1],[0,0]]]}` | `null` | `{"type":"Polygon","coordinates":[[[0,0],[0,1],[1,1],[0,0]]]}` |
| `{"type":"MultiPolygon","coordinates":[[[[0,0],[0,1],[1,1]…` | `null` | `{"type":"MultiPolygon","coordinates":[[[[0,0],[0,1],[1,1]…` |
| `{"type":"Point","coordinates":[1,2]}` | `null` | `{"type":"Point","coordinates":[1,2]}` |

##### `geoWithin`
| input | data-mate | DuckDB |
|---|---|---|
| `{"type":"Point","coordinates":[1,2]}` | `null` | `{"type":"Point","coordinates":[1,2]}` |
| `{"type":"Polygon","coordinates":[[[0,0],[0,1],[1,1],[0,0]]]}` | `null` | `{"type":"Polygon","coordinates":[[[0,0],[0,1],[1,1],[0,0]]]}` |
| `{"type":"MultiPolygon","coordinates":[[[[0,0],[0,1],[1,1]…` | `null` | `{"type":"MultiPolygon","coordinates":[[[[0,0],[0,1],[1,1]…` |
| `{"type":"Point","coordinates":[1,2]}` | `null` | `{"type":"Point","coordinates":[1,2]}` |

##### `inGeoBoundingBox`
| input | data-mate | DuckDB |
|---|---|---|
| `{"type":"Point","coordinates":[1,2]}` | `null` | `{"type":"Point","coordinates":[1,2]}` |
| `{"type":"Polygon","coordinates":[[[0,0],[0,1],[1,1],[0,0]]]}` | `null` | `{"type":"Polygon","coordinates":[[[0,0],[0,1],[1,1],[0,0]]]}` |
| `{"type":"MultiPolygon","coordinates":[[[[0,0],[0,1],[1,1]…` | `null` | `{"type":"MultiPolygon","coordinates":[[[[0,0],[0,1],[1,1]…` |
| `{"type":"Point","coordinates":[1,2]}` | `null` | `{"type":"Point","coordinates":[1,2]}` |

##### `isGeoJSON`
| input | data-mate | DuckDB |
|---|---|---|
| `{"type":"Point","coordinates":[1,2]}` | `null` | `{"type":"Point","coordinates":[1,2]}` |
| `{"type":"Polygon","coordinates":[[[0,0],[0,1],[1,1],[0,0]]]}` | `null` | `{"type":"Polygon","coordinates":[[[0,0],[0,1],[1,1],[0,0]]]}` |
| `{"type":"MultiPolygon","coordinates":[[[[0,0],[0,1],[1,1]…` | `null` | `{"type":"MultiPolygon","coordinates":[[[[0,0],[0,1],[1,1]…` |
| `{"type":"Point","coordinates":[1,2]}` | `null` | `{"type":"Point","coordinates":[1,2]}` |
| `{"type":"Nonsense","coordinates":[]}` | `null` | `{"type":"Nonsense","coordinates":[]}` |
| `{"type":"Point"}` | `null` | `{"type":"Point"}` |

##### `isGeoShapeMultiPolygon`
| input | data-mate | DuckDB |
|---|---|---|
| `{"type":"MultiPolygon","coordinates":[[[[0,0],[0,1],[1,1]…` | `null` | `{"type":"MultiPolygon","coordinates":[[[[0,0],[0,1],[1,1]…` |

##### `isGeoShapePoint`
| input | data-mate | DuckDB |
|---|---|---|
| `{"type":"Point","coordinates":[1,2]}` | `null` | `{"type":"Point","coordinates":[1,2]}` |
| `{"type":"Point","coordinates":[1,2]}` | `null` | `{"type":"Point","coordinates":[1,2]}` |

##### `isGeoShapePolygon`
| input | data-mate | DuckDB |
|---|---|---|
| `{"type":"Polygon","coordinates":[[[0,0],[0,1],[1,1],[0,0]]]}` | `null` | `{"type":"Polygon","coordinates":[[[0,0],[0,1],[1,1],[0,0]]]}` |

</details>

### IP (21) — 9 drift, 3 exact, 9 no-equivalent
| function | kind | parity | behaviour | DuckDB candidate |
|---|---|---|---|---|
| `extractMappedIPv4` | T | — none | extracts the embedded v4 from a mapped v6 address | — |
| `getCIDRBroadcast` | T | ⚠️ drift (0/7) | broadcast address of a CIDR | `broadcast(TRY_CAST(v AS INET))::VARCHAR` |
| `getCIDRMax` | T | ⚠️ drift (1/7) ⓐ | last address in a CIDR | `broadcast(TRY_CAST(v AS INET))::VARCHAR` |
| `getCIDRMin` | T | ⚠️ drift (1/7) ⓐ | first address in a CIDR | `network(TRY_CAST(v AS INET))::VARCHAR` |
| `getCIDRNetwork` | T | ⚠️ drift (0/7) | network address of a CIDR | `network(TRY_CAST(v AS INET))::VARCHAR` |
| `getFirstIPInCIDR` | T | ⚠️ drift (1/7) ⓐ | first address | `network(TRY_CAST(v AS INET))::VARCHAR` |
| `getFirstUsableIPInCIDR` | T | — none | first usable excludes the network address; arithmetic on INET unverified | — |
| `getLastIPInCIDR` | T | ⚠️ drift (1/7) ⓐ | last address | `broadcast(TRY_CAST(v AS INET))::VARCHAR` |
| `getLastUsableIPInCIDR` | T | — none | last usable excludes broadcast; arithmetic on INET unverified | — |
| `inIPRange` | V | ⚠️ drift (15/16) | membership in a CIDR | `TRY_CAST(v AS INET) <<= '10.0.0.0/8'::INET` |
| `intToIP` | T | — none | inverse of ipToInt | — |
| `ipToInt` | T | — none | data-mate returns an unbounded bigint; INET has no direct numeric cast in this build | — |
| `isCIDR` | V | ✅ exact | a CIDR range | `TRY_CAST(v AS INET) IS NOT NULL AND position('/' in v) > 0` |
| `isIP` | V | ⚠️ drift (15/16) | a bare IPv4 or IPv6 address | `TRY_CAST(v AS INET) IS NOT NULL AND position('/' in v) = 0` |
| `isIPv4` | V | ⚠️ drift (15/16) | IPv4 only | `TRY_CAST(v AS INET) IS NOT NULL AND family(TRY_CAST(v AS INET)) = 4 AND position('/' in v)` |
| `isIPv6` | V | ✅ exact | IPv6 only | `TRY_CAST(v AS INET) IS NOT NULL AND family(TRY_CAST(v AS INET)) = 6 AND position('/' in v)` |
| `isMappedIPv4` | V | ✅ exact ⓐ | IPv4-mapped IPv6 address | `TRY_CAST(v AS INET) IS NOT NULL AND family(TRY_CAST(v AS INET)) = 6 AND v LIKE '::ffff:%'` |
| `isNonRoutableIP` | V | — none | inverse of isRoutableIP | — |
| `isRoutableIP` | V | — none | checks against the reserved/private block tables | — |
| `reverseIP` | T | — none | reverses octet/hextet order as a string | — |
| `toCIDR` | T | — none | builds a CIDR from an address plus a suffix arg | — |

<details>
<summary>IP divergence detail (9)</summary>

##### `getCIDRBroadcast`
| input | data-mate | DuckDB |
|---|---|---|
| `1.2.3.4/24` | `1.2.3.255` | `1.2.3.255/24` |
| `10.0.0.0/8` | `10.255.255.255` | `10.255.255.255/8` |
| `192.168.0.0/16` | `192.168.255.255` | `192.168.255.255/16` |
| `172.16.0.0/12` | `172.31.255.255` | `172.31.255.255/12` |
| `0.0.0.0/0` | `255.255.255.255` | `255.255.255.255/0` |
| `2001:db8::/32` | **THROW** | `2001:db8:ffff:ffff:ffff:ffff:ffff:ffff/32` |
| `::1/128` | **THROW** | `::1` |

##### `getCIDRMax`
| input | data-mate | DuckDB |
|---|---|---|
| `1.2.3.4/24` | `1.2.3.254` | `1.2.3.255/24` |
| `10.0.0.0/8` | `10.255.255.254` | `10.255.255.255/8` |
| `192.168.0.0/16` | `192.168.255.254` | `192.168.255.255/16` |
| `172.16.0.0/12` | `172.31.255.254` | `172.31.255.255/12` |
| `0.0.0.0/0` | `255.255.255.254` | `255.255.255.255/0` |
| `2001:db8::/32` | `2001:db8:ffff:ffff:ffff:ffff:ffff:ffff` | `2001:db8:ffff:ffff:ffff:ffff:ffff:ffff/32` |

##### `getCIDRMin`
| input | data-mate | DuckDB |
|---|---|---|
| `1.2.3.4/24` | `1.2.3.1` | `1.2.3.0/24` |
| `10.0.0.0/8` | `10.0.0.1` | `10.0.0.0/8` |
| `192.168.0.0/16` | `192.168.0.1` | `192.168.0.0/16` |
| `172.16.0.0/12` | `172.16.0.1` | `172.16.0.0/12` |
| `0.0.0.0/0` | `0.0.0.1` | `0.0.0.0/0` |
| `2001:db8::/32` | `2001:db8::1` | `2001:db8::/32` |

##### `getCIDRNetwork`
| input | data-mate | DuckDB |
|---|---|---|
| `1.2.3.4/24` | `1.2.3.0` | `1.2.3.0/24` |
| `10.0.0.0/8` | `10.0.0.0` | `10.0.0.0/8` |
| `192.168.0.0/16` | `192.168.0.0` | `192.168.0.0/16` |
| `172.16.0.0/12` | `172.16.0.0` | `172.16.0.0/12` |
| `0.0.0.0/0` | `0.0.0.0` | `0.0.0.0/0` |
| `2001:db8::/32` | **THROW** | `2001:db8::/32` |
| `::1/128` | **THROW** | `::1` |

##### `getFirstIPInCIDR`
| input | data-mate | DuckDB |
|---|---|---|
| `1.2.3.4/24` | `1.2.3.0` | `1.2.3.0/24` |
| `10.0.0.0/8` | `10.0.0.0` | `10.0.0.0/8` |
| `192.168.0.0/16` | `192.168.0.0` | `192.168.0.0/16` |
| `172.16.0.0/12` | `172.16.0.0` | `172.16.0.0/12` |
| `0.0.0.0/0` | `0.0.0.0` | `0.0.0.0/0` |
| `2001:db8::/32` | `2001:db8::` | `2001:db8::/32` |

##### `getLastIPInCIDR`
| input | data-mate | DuckDB |
|---|---|---|
| `1.2.3.4/24` | `1.2.3.255` | `1.2.3.255/24` |
| `10.0.0.0/8` | `10.255.255.255` | `10.255.255.255/8` |
| `192.168.0.0/16` | `192.168.255.255` | `192.168.255.255/16` |
| `172.16.0.0/12` | `172.31.255.255` | `172.31.255.255/12` |
| `0.0.0.0/0` | `255.255.255.255` | `255.255.255.255/0` |
| `2001:db8::/32` | `2001:db8:ffff:ffff:ffff:ffff:ffff:ffff` | `2001:db8:ffff:ffff:ffff:ffff:ffff:ffff/32` |

##### `inIPRange`
| input | data-mate | DuckDB |
|---|---|---|
| `10.0.0.0/8` | `null` | `10.0.0.0/8` |

##### `isIP`
| input | data-mate | DuckDB |
|---|---|---|
| `01.02.03.04` | `null` | `01.02.03.04` |

##### `isIPv4`
| input | data-mate | DuckDB |
|---|---|---|
| `01.02.03.04` | `null` | `01.02.03.04` |

</details>

### JSON (4) — 2 no-equivalent, 1 drift, 1 exact
| function | kind | parity | behaviour | DuckDB candidate |
|---|---|---|---|---|
| `cast` | T | — none | re-types a field without changing the value; a metadata operation, not an expression | — |
| `parseJSON` | T | ⚠️ drift (22/23) | parses a JSON string into a value | `json(v)` |
| `setDefault` | T | — none | substitutes a default when the value is nil; needs the target field config | — |
| `toJSON` | T | ✅ exact | serializes a value to a JSON string | `to_json(v)` |

<details>
<summary>JSON divergence detail (1)</summary>

##### `parseJSON`
| input | data-mate | DuckDB |
|---|---|---|
| `true` | `true` | `true` |

</details>

### NUMERIC (53) — 25 drift, 20 exact, 5 no-equivalent, 3 array-input
| function | kind | parity | behaviour | DuckDB candidate |
|---|---|---|---|---|
| `abs` | T | ⚠️ drift (20/22) | absolute value | `abs(TRY_CAST(v AS DOUBLE))` |
| `acos` | T | ✅ exact | arccosine, radians | `acos(TRY_CAST(v AS DOUBLE))` |
| `acosh` | T | ⚠️ drift (12/22) | inverse hyperbolic cosine | `acosh(TRY_CAST(v AS DOUBLE))` |
| `add` | T | ✅ exact | add a scalar | `TRY_CAST(v AS DOUBLE) + 5` |
| `addValues` | T | — array | sum of an array field (array-valued field; not exercised by the scalar battery) | `list_sum(v::DOUBLE[])` |
| `asin` | T | ✅ exact | arcsine, radians | `asin(TRY_CAST(v AS DOUBLE))` |
| `asinh` | T | ⚠️ drift (20/22) | inverse hyperbolic sine | `asinh(TRY_CAST(v AS DOUBLE))` |
| `atan` | T | ✅ exact | arctangent, radians | `atan(TRY_CAST(v AS DOUBLE))` |
| `atan2` | T | ⚠️ drift (1/22) | two-argument arctangent | `atan2(TRY_CAST(v AS DOUBLE), 2)` |
| `atanh` | T | ⚠️ drift (20/22) | inverse hyperbolic tangent | `atanh(TRY_CAST(v AS DOUBLE))` |
| `cbrt` | T | ⚠️ drift (20/22) | cube root | `cbrt(TRY_CAST(v AS DOUBLE))` |
| `ceil` | T | ⚠️ drift (19/22) | round up | `ceil(TRY_CAST(v AS DOUBLE))` |
| `clz32` | T | — none | count leading zeros in a 32-bit int; no direct SQL function | — |
| `cos` | T | ✅ exact | cosine | `cos(TRY_CAST(v AS DOUBLE))` |
| `cosh` | T | ⚠️ drift (15/22) | hyperbolic cosine | `cosh(TRY_CAST(v AS DOUBLE))` |
| `divide` | T | ✅ exact | divide by a scalar | `TRY_CAST(v AS DOUBLE) / 2` |
| `divideValues` | T | — none | left-fold division over an array; ordering semantics unverified | — |
| `exp` | T | ⚠️ drift (17/22) | e^x | `exp(TRY_CAST(v AS DOUBLE))` |
| `expm1` | T | ⚠️ drift (17/22) | e^x - 1, precision-preserving in JS | `exp(TRY_CAST(v AS DOUBLE)) - 1` |
| `floor` | T | ⚠️ drift (19/22) | round down | `floor(TRY_CAST(v AS DOUBLE))` |
| `fround` | T | ⚠️ drift (20/22) | round to nearest float32 | `TRY_CAST(TRY_CAST(v AS FLOAT) AS DOUBLE)` |
| `hypot` | T | ⚠️ drift (4/22) | sqrt of sum of squares | `sqrt(pow(TRY_CAST(v AS DOUBLE),2) + pow(2,2))` |
| `inNumberRange` | V | ✅ exact | range test; min/max exclusive unless inclusive arg set | `TRY_CAST(v AS DOUBLE) > 0 AND TRY_CAST(v AS DOUBLE) < 100` |
| `isEven` | V | ✅ exact | even test | `(TRY_CAST(v AS DOUBLE) % 2) = 0` |
| `isGreaterThan` | V | ✅ exact | strict greater-than | `TRY_CAST(v AS DOUBLE) > 5` |
| `isGreaterThanOrEqualTo` | V | ✅ exact | greater or equal | `TRY_CAST(v AS DOUBLE) >= 5` |
| `isLessThan` | V | ✅ exact | strict less-than | `TRY_CAST(v AS DOUBLE) < 5` |
| `isLessThanOrEqualTo` | V | ✅ exact | less or equal | `TRY_CAST(v AS DOUBLE) <= 5` |
| `isOdd` | V | ⚠️ drift (21/22) | odd test | `abs(TRY_CAST(v AS DOUBLE) % 2) = 1` |
| `log` | T | ⚠️ drift (21/22) | natural log | `ln(TRY_CAST(v AS DOUBLE))` |
| `log10` | T | ⚠️ drift (21/22) | base-10 log | `log10(TRY_CAST(v AS DOUBLE))` |
| `log1p` | T | ⚠️ drift (21/22) | ln(1+x) | `ln(1 + TRY_CAST(v AS DOUBLE))` |
| `log2` | T | ⚠️ drift (21/22) | base-2 log | `log2(TRY_CAST(v AS DOUBLE))` |
| `maxValues` | T | — array | max of an array field (array-valued field; not exercised by the scalar battery) | `list_max(v::DOUBLE[])` |
| `minValues` | T | — array | min of an array field (array-valued field; not exercised by the scalar battery) | `list_min(v::DOUBLE[])` |
| `modulus` | T | ✅ exact | remainder | `TRY_CAST(v AS DOUBLE) % 3` |
| `multiply` | T | ✅ exact | multiply by a scalar | `TRY_CAST(v AS DOUBLE) * 3` |
| `multiplyValues` | T | — none | left-fold product over an array; no list_product in this build | — |
| `pow` | T | ⚠️ drift (20/22) | x raised to a power | `pow(TRY_CAST(v AS DOUBLE), 2)` |
| `random` | T | — none | non-deterministic; excluded from parity by definition | — |
| `round` | T | ⚠️ drift (18/22) | round to nearest integer | `round(TRY_CAST(v AS DOUBLE))` |
| `setPrecision` | T | ⚠️ drift (21/22) | round to N decimal places | `round(TRY_CAST(v AS DOUBLE), 2)` |
| `sign` | T | ✅ exact | -1, 0 or 1 | `sign(TRY_CAST(v AS DOUBLE))` |
| `sin` | T | ✅ exact | sine | `sin(TRY_CAST(v AS DOUBLE))` |
| `sinh` | T | ⚠️ drift (15/22) | hyperbolic sine | `sinh(TRY_CAST(v AS DOUBLE))` |
| `sqrt` | T | ⚠️ drift (21/22) | square root | `sqrt(TRY_CAST(v AS DOUBLE))` |
| `subtract` | T | ✅ exact | subtract a scalar | `TRY_CAST(v AS DOUBLE) - 5` |
| `subtractValues` | T | — none | left-fold subtraction over an array; list_reduce exists but ordering semantics unverified | — |
| `tan` | T | ✅ exact | tangent | `tan(TRY_CAST(v AS DOUBLE))` |
| `tanh` | T | ✅ exact | hyperbolic tangent | `tanh(TRY_CAST(v AS DOUBLE))` |
| `toCelsius` | T | ⚠️ drift (21/22) | fahrenheit to celsius; data-mate rounds to 2dp | `round((TRY_CAST(v AS DOUBLE) - 32) * 5.0/9.0, 2)` |
| `toFahrenheit` | T | ✅ exact | celsius to fahrenheit; data-mate rounds to 2dp | `round((TRY_CAST(v AS DOUBLE) * 9.0/5.0) + 32, 2)` |
| `toNumber` | T | ⚠️ drift (21/23) | coerce to number | `TRY_CAST(v AS DOUBLE)` |

<details>
<summary>NUMERIC divergence detail (25)</summary>

##### `abs`
| input | data-mate | DuckDB |
|---|---|---|
| `Infinity` | `null` | `Infinity` |
| `-Infinity` | `null` | `Infinity` |

##### `acosh`
| input | data-mate | DuckDB |
|---|---|---|
| `-0` | `null` | `NaN` |
| `Infinity` | `null` | `Infinity` |
| `-Infinity` | `null` | `NaN` |
| `.5` | `null` | `NaN` |
| `0` | `null` | `NaN` |
| `-1` | `null` | `NaN` |
| `-2.5` | `null` | `NaN` |
| `0.1` | `null` | `NaN` |
| `-1000000000000000` | `null` | `NaN` |
| `-0.0001` | `null` | `NaN` |

##### `asinh`
| input | data-mate | DuckDB |
|---|---|---|
| `Infinity` | `null` | `Infinity` |
| `-Infinity` | `null` | `-Infinity` |

##### `atan2`
| input | data-mate | DuckDB |
|---|---|---|
| `12` | **THROW** | `1.405647649` |
| `12.7` | **THROW** | `1.414598817` |
| `-0` | **THROW** | `0` |
| `1e3` | **THROW** | `1.568796329` |
| ` 7 ` | **THROW** | `1.292496668` |
| `Infinity` | **THROW** | `1.570796327` |
| `-Infinity` | **THROW** | `-1.570796327` |
| `999999999999999999999` | **THROW** | `1.570796327` |
| `.5` | **THROW** | `0.2449786631` |
| `5.` | **THROW** | `1.19028995` |
| `0` | **THROW** | `0` |
| `1` | **THROW** | `0.463647609` |

_…9 more_

##### `atanh`
| input | data-mate | DuckDB |
|---|---|---|
| `1` | `null` | `Infinity` |
| `-1` | `null` | `Infinity` |

##### `cbrt`
| input | data-mate | DuckDB |
|---|---|---|
| `Infinity` | `null` | `Infinity` |
| `-Infinity` | `null` | `-Infinity` |

##### `ceil`
| input | data-mate | DuckDB |
|---|---|---|
| `Infinity` | `null` | `Infinity` |
| `-Infinity` | `null` | `-Infinity` |
| `999999999999999999999` | **THROW** | `1e+21` |

##### `cosh`
| input | data-mate | DuckDB |
|---|---|---|
| `1e3` | `null` | `Infinity` |
| `Infinity` | `null` | `Infinity` |
| `-Infinity` | `null` | `Infinity` |
| `999999999999999999999` | `null` | `Infinity` |
| `1000000000000000` | `null` | `Infinity` |
| `-1000000000000000` | `null` | `Infinity` |
| `99999.999` | `null` | `Infinity` |

##### `exp`
| input | data-mate | DuckDB |
|---|---|---|
| `1e3` | `null` | `Infinity` |
| `Infinity` | `null` | `Infinity` |
| `999999999999999999999` | `null` | `Infinity` |
| `1000000000000000` | `null` | `Infinity` |
| `99999.999` | `null` | `Infinity` |

##### `expm1`
| input | data-mate | DuckDB |
|---|---|---|
| `1e3` | `null` | `Infinity` |
| `Infinity` | `null` | `Infinity` |
| `999999999999999999999` | `null` | `Infinity` |
| `1000000000000000` | `null` | `Infinity` |
| `99999.999` | `null` | `Infinity` |

##### `floor`
| input | data-mate | DuckDB |
|---|---|---|
| `Infinity` | `null` | `Infinity` |
| `-Infinity` | `null` | `-Infinity` |
| `999999999999999999999` | **THROW** | `1e+21` |

##### `fround`
| input | data-mate | DuckDB |
|---|---|---|
| `Infinity` | `null` | `Infinity` |
| `-Infinity` | `null` | `-Infinity` |

##### `hypot`
| input | data-mate | DuckDB |
|---|---|---|
| `12` | `12` | `12.16552506` |
| `12.7` | `12.7` | `12.85651586` |
| `-0` | `0` | `2` |
| `1e3` | `1000` | `1000.002` |
| ` 7 ` | `7` | `7.280109889` |
| `Infinity` | `null` | `Infinity` |
| `-Infinity` | `null` | `Infinity` |
| `.5` | `0.5` | `2.061552813` |
| `5.` | `5` | `5.385164807` |
| `0` | `0` | `2` |
| `1` | `1` | `2.236067977` |
| `-1` | `1` | `2.236067977` |

_…6 more_

##### `isOdd`
| input | data-mate | DuckDB |
|---|---|---|
| `-1` | `null` | `-1` |

##### `log`
| input | data-mate | DuckDB |
|---|---|---|
| `Infinity` | `null` | `Infinity` |

##### `log10`
| input | data-mate | DuckDB |
|---|---|---|
| `Infinity` | `null` | `Infinity` |

##### `log1p`
| input | data-mate | DuckDB |
|---|---|---|
| `Infinity` | `null` | `Infinity` |

##### `log2`
| input | data-mate | DuckDB |
|---|---|---|
| `Infinity` | `null` | `Infinity` |

##### `pow`
| input | data-mate | DuckDB |
|---|---|---|
| `Infinity` | `null` | `Infinity` |
| `-Infinity` | `null` | `Infinity` |

##### `round`
| input | data-mate | DuckDB |
|---|---|---|
| `Infinity` | `null` | `Infinity` |
| `-Infinity` | `null` | `-Infinity` |
| `999999999999999999999` | **THROW** | `1e+21` |
| `-2.5` | `-2` | `-3` |

##### `setPrecision`
| input | data-mate | DuckDB |
|---|---|---|
| `999999999999999999999` | `1e+21` | `999999999999999900000` |

##### `sinh`
| input | data-mate | DuckDB |
|---|---|---|
| `1e3` | `null` | `Infinity` |
| `Infinity` | `null` | `Infinity` |
| `-Infinity` | `null` | `-Infinity` |
| `999999999999999999999` | `null` | `Infinity` |
| `1000000000000000` | `null` | `Infinity` |
| `-1000000000000000` | `null` | `-Infinity` |
| `99999.999` | `null` | `Infinity` |

##### `sqrt`
| input | data-mate | DuckDB |
|---|---|---|
| `Infinity` | `null` | `Infinity` |

##### `toCelsius`
| input | data-mate | DuckDB |
|---|---|---|
| `999999999999999999999` | `555555555555555600000` | `555555555555555540000` |

##### `toNumber`
| input | data-mate | DuckDB |
|---|---|---|
| `""` | `0` | `null` |
| `   ` | `0` | `null` |

</details>

### OBJECT (3) — 2 no-equivalent, 1 exact
| function | kind | parity | behaviour | DuckDB candidate |
|---|---|---|---|---|
| `equals` | V | — none | deep equality against an arbitrary arg value; shape-dependent | — |
| `isEmpty` | V | ✅ exact | true for nil/empty; ignoreWhitespace arg trims first | `(v IS NULL OR v = '')` |
| `lookup` | T | — none | table/map lookup against a user-supplied dictionary arg | — |
### STRING (50) — 12 drift, 22 exact, 16 no-equivalent
| function | kind | parity | behaviour | DuckDB candidate |
|---|---|---|---|---|
| `contains` | V | ✅ exact | substring test | `contains(v, 'a')` |
| `createID` | T | — none | hash over configured field set; needs row context, not a scalar | — |
| `decodeBase64` | T | ⚠️ drift (1/23) | base64 decode | `from_base64(v)::VARCHAR` |
| `decodeHex` | T | ⚠️ drift (2/23) | hex decode | `unhex(v)::VARCHAR` |
| `decodeURL` | T | ✅ exact | percent-decode | `url_decode(v)` |
| `encode` | T | — none | dispatches to an encoding named by an arg; a router, not one expression | — |
| `encodeBase64` | T | ⚠️ drift (16/23) | base64 encode | `to_base64(v::BLOB)` |
| `encodeHex` | T | ✅ exact | hex encode | `lower(hex(v))` |
| `encodeSHA` | T | ✅ exact | SHA-256 hex digest (default 256) | `sha256(v)` |
| `encodeSHA1` | T | ✅ exact | SHA-1 hex digest | `sha1(v)` |
| `encodeURL` | T | ✅ exact | percent-encode | `url_encode(v)` |
| `endsWith` | V | ✅ exact | suffix test | `ends_with(v, 'c')` |
| `entropy` | T | — none | Shannon entropy per string; no scalar SQL form | — |
| `extract` | T | ⚠️ drift (14/23) | regex or start/end extraction | `regexp_extract(v, '([a-z]+)', 1)` |
| `isAlpha` | V | ✅ exact | letters only; locale arg unsupported in SQL | `regexp_full_match(v, '[a-zA-Z]+')` |
| `isAlphaNumeric` | V | ✅ exact | letters and digits only | `regexp_full_match(v, '[a-zA-Z0-9]+')` |
| `isBase64` | V | ⚠️ drift (20/23) | approximation; validator lib is stricter | `regexp_full_match(v, '[A-Za-z0-9+/]*={0,2}') AND length(v) % 4 = 0 AND length(v) > 0` |
| `isCountryCode` | V | — none | ISO-3166 table lookup | — |
| `isEmail` | V | ⚠️ drift (8/11) ⓐ | APPROXIMATION - the validator library is stricter (rejects a@b..com, accepts quoted locals) | `regexp_full_match(v, '[^@\s]+@[^@\s]+\.[^@\s]+')` |
| `isFQDN` | V | ✅ exact ⓐ | APPROXIMATION of validator.isFQDN | `regexp_full_match(v, '([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}')` |
| `isHash` | V | — none | length+charset per named algorithm arg; a router over ~15 variants | — |
| `isISDN` | V | — none | phone-number parsing via awesome-phonenumber | — |
| `isLength` | V | ✅ exact | length range test | `length(v) BETWEEN 2 AND 6` |
| `isMACAddress` | V | ✅ exact ⓐ | APPROXIMATION; data-mate supports several delimiter styles | `regexp_full_match(v, '([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}')` |
| `isMIMEType` | V | — none | validator lib table of registered MIME types | — |
| `isPhoneNumberLike` | V | — none | phone-number parsing via awesome-phonenumber | — |
| `isPort` | V | ⚠️ drift (16/22) | valid TCP/UDP port | `TRY_CAST(v AS INTEGER) BETWEEN 1 AND 65535` |
| `isPostalCode` | V | — none | per-locale postal patterns from the validator library | — |
| `isString` | V | ✅ exact | type test; every staged value is already VARCHAR so this is vacuous here | `v IS NOT NULL` |
| `isURL` | V | ✅ exact ⓐ | APPROXIMATION of validator.isURL | `regexp_full_match(v, 'https?://[^\s]+')` |
| `isUUID` | V | ✅ exact | UUID test | `TRY_CAST(v AS UUID) IS NOT NULL` |
| `join` | T | — none | joins an ARRAY field into a string; array-input, covered by array_to_string | — |
| `replaceLiteral` | T | ⚠️ drift (22/23) | literal substring replace | `replace(v, 'a', 'X')` |
| `replaceRegex` | T | ✅ exact | regex replace; RE2 only | `regexp_replace(v, '[0-9]', 'X', 'g')` |
| `reverse` | T | ⚠️ drift (19/23) | reverse; data-mate reverses UTF-16 code units and corrupts astral characters (defect D3) | `reverse(v)` |
| `split` | T | ✅ exact | split into an array | `string_split(v, ',')` |
| `startsWith` | V | ✅ exact | prefix test | `starts_with(v, 'a')` |
| `toCamelCase` | T | — none | word-splitting plus diacritic folding; regex approximation would drift | — |
| `toISDN` | T | — none | phone-number normalization via awesome-phonenumber | — |
| `toKebabCase` | T | — none | as toCamelCase | — |
| `toLowerCase` | T | ⚠️ drift (22/23) | lowercase; differs on Turkish dotted I | `lower(v)` |
| `toPascalCase` | T | — none | as toCamelCase | — |
| `toSnakeCase` | T | — none | data-mate also strips diacritics (ünïcödé→unicode); regex alone drifts | — |
| `toString` | T | ✅ exact | stringify | `v::VARCHAR` |
| `toTitleCase` | T | — none | as toCamelCase | — |
| `toUpperCase` | T | ⚠️ drift (21/23) | uppercase; JS does full case-folding (ß→SS), SQL does not | `upper(v)` |
| `trim` | T | ✅ exact | trim both ends; optional char arg | `trim(v)` |
| `trimEnd` | T | ✅ exact | trim trailing | `rtrim(v)` |
| `trimStart` | T | ✅ exact | trim leading | `ltrim(v)` |
| `truncate` | T | ⚠️ drift (22/23) | first N characters | `left(v, 4)` |

<details>
<summary>STRING divergence detail (12)</summary>

##### `decodeBase64`
| input | data-mate | DuckDB |
|---|---|---|
| `abc` | `i�` | `null` |
| `ABC` | `\x00\x10` | `null` |
| `MiXeD` | `2%�` | `null` |
| `   ` | `""` | `null` |
| `  pad  ` | `��` | `null` |
| `a\x09b` | `i` | `null` |
| `a\x0ab` | `i` | `null` |
| `0` | `""` | `null` |
| `42` | `�` | `null` |
| `-1` | `�` | `null` |
| `true` | `���` | `\\xB6\\xBB\\x9E` |
| `ünïcödé` | `��` | `null` |

_…10 more_

##### `decodeHex`
| input | data-mate | DuckDB |
|---|---|---|
| `abc` | `�` | `\\x0A\\xBC` |
| `ABC` | `�` | `\\x0A\\xBC` |
| `MiXeD` | `""` | `null` |
| `   ` | `""` | `null` |
| `  pad  ` | `""` | `null` |
| `a\x09b` | `""` | `null` |
| `a\x0ab` | `""` | `null` |
| `0` | `""` | `\\x00` |
| `-1` | `""` | `null` |
| `true` | `""` | `null` |
| `ünïcödé` | `""` | `null` |
| `ß` | `""` | `null` |

_…9 more_

##### `encodeBase64`
| input | data-mate | DuckDB |
|---|---|---|
| `ünïcödé` | `w7xuw69jw7Zkw6k=` | `null` |
| `ß` | `w58=` | `null` |
| `İstanbul` | `xLBzdGFuYnVs` | `null` |
| `ﬁ` | `76yB` | `null` |
| `😀x` | `8J+YgHg=` | `null` |
| `a😀b` | `YfCfmIBi` | `null` |
| `👨‍👩‍👧` | `8J+RqOKAjfCfkanigI3wn5Gn` | `null` |

##### `extract`
| input | data-mate | DuckDB |
|---|---|---|
| `ABC` | `null` | `""` |
| `""` | `null` | `""` |
| `   ` | `null` | `""` |
| `0` | `null` | `""` |
| `42` | `null` | `""` |
| `-1` | `null` | `""` |
| `ß` | `null` | `""` |
| `ﬁ` | `null` | `""` |
| `👨‍👩‍👧` | `null` | `""` |

##### `isBase64`
| input | data-mate | DuckDB |
|---|---|---|
| `""` | `""` | `null` |
| `true` | `null` | `true` |
| `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa…` | `null` | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa…` |

##### `isEmail`
| input | data-mate | DuckDB |
|---|---|---|
| `a@b..com` | `null` | `a@b..com` |
| `"quoted"@example.com` | `null` | `"quoted"@example.com` |
| `a@[192.168.1.1]` | `null` | `a@[192.168.1.1]` |

##### `isPort`
| input | data-mate | DuckDB |
|---|---|---|
| `12.7` | `null` | `12.7` |
| `-0` | `0` | `null` |
| `.5` | `null` | `0.5` |
| `0` | `0` | `null` |
| `2.5` | `null` | `2.5` |
| `3.14159` | `null` | `3.14159` |

##### `replaceLiteral`
| input | data-mate | DuckDB |
|---|---|---|
| `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa…` | `Xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa…` | `XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX…` |

##### `reverse`
| input | data-mate | DuckDB |
|---|---|---|
| `""` | `null` | `""` |
| `😀x` | `x\ude00\ud83d` | `x😀` |
| `a😀b` | `b\ude00\ud83da` | `b😀a` |
| `👨‍👩‍👧` | `\udc67\ud83d‍\udc69\ud83d‍\udc68\ud83d` | `👨‍👩‍👧` |

##### `toLowerCase`
| input | data-mate | DuckDB |
|---|---|---|
| `İstanbul` | `i̇stanbul` | `istanbul` |

##### `toUpperCase`
| input | data-mate | DuckDB |
|---|---|---|
| `ß` | `SS` | `ẞ` |
| `ﬁ` | `FI` | `ﬁ` |

##### `truncate`
| input | data-mate | DuckDB |
|---|---|---|
| `👨‍👩‍👧` | `👨‍\ud83d` | `👨‍👩‍` |

</details>


---

## 3. Frame semantics

### Ordering

**D1 — multi-key sort sums comparisons.** `Vector.getSortedIndices`
(`src/vector/Vector.ts:45-51`) reduces per-field comparisons with `acc + (d === 'asc' ? res : -res)`.
Two keys that disagree cancel to `0`, so the comparator reports "equal" and the first key is
ignored. Fuzzed over 2000 random frames with a fixed seed:

**1528/2000 frames (76%) sorted incorrectly.**

Smallest observed failure:

|  | rows (a,b) |
|---|---|
| input | `01 22 20 22 22 12 01 00 22 20` |
| data-mate | `01 12 22 22 22 01 00 22 20 20` |
| correct | `01 01 00 12 22 22 22 22 20 20` |


**D2 — null breaks ordering of NON-NULL values.** `Vector.compare`
(`src/vector/Vector.ts:493-500`) maps nullish to `null`. For strings `null < 'a'` and
`null > 'a'` are both false, so it returns `0`: null compares equal to every string. That makes the
comparator **non-transitive**, and a non-transitive comparator does not merely misplace nulls, it
misorders real values. Rate rises with array size as V8 switches sort strategy:

| array size | frames with non-null values out of order |
|---|---|
| 8 | 119/300 (40%) |
| 16 | 209/300 (70%) |
| 32 | 284/300 (95%) |
| 64 | 300/300 (100%) |
| 128 | 300/300 (100%) |

For numerics the same mapping makes `null` compare as `0` (`null < 10` evaluates `0 < 10`), so
nulls sort first ascending and last descending — and would land **mid-range among negative numbers**.

Example at n=16:

|  | value |
|---|---|
| input | `a e a c _ b _ t _ q f e o c _ r` |
| non-null, as sorted | `a a b c e c e f o q t r` |
| non-null, correct | `a a b c c e e f o q r t` |

#### Existing test expectations that encode this

The five `->orderBy` tests in `test/data-frame-spec.ts`, checked against a
first-non-zero-key reference with nulls last. **Not modified** — listed so the freeze is informed.

| orderBy | asserted / actual | correct |  |
|---|---|---|---|
| `name` | `Billy(47) Frank(20) Jane(_) Jill(39) Nancy(10)` | `Billy(47) Frank(20) Jane(_) Jill(39) Nancy(10)` | matches |
| `name:desc` | `Nancy(10) Jill(39) Jane(_) Frank(20) Billy(47)` | `Nancy(10) Jill(39) Jane(_) Frank(20) Billy(47)` | matches |
| `age` | `Jane(_) Nancy(10) Frank(20) Jill(39) Billy(47)` | `Nancy(10) Frank(20) Jill(39) Billy(47) Jane(_)` | **differs** |
| `age:desc` | `Billy(47) Jill(39) Frank(20) Nancy(10) Jane(_)` | `Billy(47) Jill(39) Frank(20) Nancy(10) Jane(_)` | matches |
| `name:desc, age:desc` | `Jill(39) Billy(47) Frank(20) Nancy(10) Jane(_)` | `Nancy(10) Jill(39) Jane(_) Frank(20) Billy(47)` | **differs** |

`name:desc, age:desc` is the unambiguous one: the asserted result is not sorted by name in either
direction. `age` differs only in null placement, which follows from the null-as-zero mapping — where
nulls belong is a convention choice, the mechanism behind it is not.

### Unicode

**D3 — `reverse()` operates on UTF-16 code units**, so astral characters are split into
lone surrogates:

| input | data-mate | correct | produces lone surrogates |
|---|---|---|---|
| `abc` | `cba` | `cba` | no |
| `😀x` | `x\ude00\ud83d` | `x😀` | **yes** |
| `a😀b` | `b\ude00\ud83da` | `b😀a` | **yes** |
| `ünïcödé` | `édöcïnü` | `édöcïnü` | no |

Related but distinct: `toUpperCase`/`toLowerCase` use JS full case-folding
(`ß`→`SS`, `ﬁ`→`FI`), where SQL `upper()` maps to the single codepoint `ẞ` and leaves
ligatures alone. Neither is wrong; they are different standards, and v2 must pick one.

### Non-finite numbers

data-mate coerces `'Infinity'` to the JS number `Infinity` successfully, but its **numeric function
closures return `null` for non-finite results** — `abs`'s closure returns `null` for `Infinity`,
and the adapter emits `undefined`. DuckDB propagates `inf`. This is function-layer behaviour, not
coercion, and it is why most NUMERIC functions show one or two residual divergences.

### Timezone

**D5 — date coercion is process-timezone dependent.** ISO-8601 inputs parse deterministically, but
loose formats (`Mar 10 2024`, `03/10/2024`, `0`) fall through to JS
`Date` parsing, which reads the process timezone. The same input therefore produces a different
stored value on differently-configured pods.

On the DuckDB side the mirror-image hazard is that **`SET TimeZone='UTC'` is mandatory**. At the
default session timezone every `TIMESTAMPTZ` operation silently shifts:
`date_part('hour', …)` returned 7 where data-mate returned 14, and `date_trunc('day', …)`
moved results to the previous day. This is configuration, not a defect, but it is silent.

### Other frame semantics v2 must decide
| area | current behaviour | source |
|---|---|---|
| validator return | validators return the **value or null**, not a boolean (`validatorTransformFN`) | `adapters/data-frame-adapter/index.ts:147` |
| failed validation on a whole column | `validateAccepts` failure returns `column.clearAll()` — an all-null column, not an error | `adapters/data-frame-adapter/index.ts:204` |
| coercion failure | throws on the **first** bad value, rejecting the whole batch | `builder/Builder.ts:107` |
| null vs undefined | treated identically; `SerializeOptions.useNullForUndefined` decides what is emitted | `vector/interfaces.ts:77` |
| aggregation widening | `avg` on Long→Double, `sum` on Long/Integer→Long, `count`→Integer; unsupported types throw | `aggregation-frame/utils.ts:7-60` |
| dedup / group keys | `getHashCodeFrom`, md5 above 1024 chars | `builder/type-coercion.ts:159` |
| wire format | dfjson: line 0 a JSON header `{v,name,size,metadata,config}`, then one line per column | `data-frame/DataFrame.ts:1175` |
| row-count without parsing | consumers read `size` from the header line without deserializing the body | `ThreadedReaderWorker.ts:392` |

---

## 4. Gap list

What v2 must build, ordered by how much of the catalogue each unblocks.

### 4.1 Types with no single-expression coercion (6)

These need a decided representation before anything above them can be specified.

| FieldType | candidate representation |
|---|---|
| `Binary` | `BLOB` |
| `GeoJSON` | `GEOMETRY (spatial ext)` |
| `Boundary` | `LIST(STRUCT(lat,lon))` |
| `Object` | `STRUCT (known children) or JSON` |
| `Tuple` | `STRUCT with positional keys` |
| `Any` | `VARIANT` |
### 4.2 Functions with no DuckDB equivalent (56 of 205)

> **STALE — 41 of these now run as SQL.** See the banner at the top of this file; `docs/sql-emission.md` is the authority. The line below about none of these being guesses is the specific claim that did not hold.

Each must be implemented in v2 as a scalar UDF, a host-side pass, or a deliberate
behaviour change. **None of these are guesses** — a candidate was only omitted where none was found.

| function | category | why |
|---|---|---|
| `equals` | OBJECT | deep equality against an arbitrary arg value; shape-dependent |
| `lookup` | OBJECT | table/map lookup against a user-supplied dictionary arg |
| `cast` | JSON | re-types a field without changing the value; a metadata operation, not an expression |
| `setDefault` | JSON | substitutes a default when the value is nil; needs the target field config |
| `addValues` | NUMERIC | sum of an array field (array-valued field; not exercised by the scalar battery) |
| `clz32` | NUMERIC | count leading zeros in a 32-bit int; no direct SQL function |
| `divideValues` | NUMERIC | left-fold division over an array; ordering semantics unverified |
| `maxValues` | NUMERIC | max of an array field (array-valued field; not exercised by the scalar battery) |
| `minValues` | NUMERIC | min of an array field (array-valued field; not exercised by the scalar battery) |
| `multiplyValues` | NUMERIC | left-fold product over an array; no list_product in this build |
| `random` | NUMERIC | non-deterministic; excluded from parity by definition |
| `subtractValues` | NUMERIC | left-fold subtraction over an array; list_reduce exists but ordering semantics unverified |
| `createID` | STRING | hash over configured field set; needs row context, not a scalar |
| `encode` | STRING | dispatches to an encoding named by an arg; a router, not one expression |
| `entropy` | STRING | Shannon entropy per string; no scalar SQL form |
| `isCountryCode` | STRING | ISO-3166 table lookup |
| `isHash` | STRING | length+charset per named algorithm arg; a router over ~15 variants |
| `isISDN` | STRING | phone-number parsing via awesome-phonenumber |
| `isMIMEType` | STRING | validator lib table of registered MIME types |
| `isPhoneNumberLike` | STRING | phone-number parsing via awesome-phonenumber |
| `isPostalCode` | STRING | per-locale postal patterns from the validator library |
| `join` | STRING | joins an ARRAY field into a string; array-input, covered by array_to_string |
| `toCamelCase` | STRING | word-splitting plus diacritic folding; regex approximation would drift |
| `toISDN` | STRING | phone-number normalization via awesome-phonenumber |
| `toKebabCase` | STRING | as toCamelCase |
| `toPascalCase` | STRING | as toCamelCase |
| `toSnakeCase` | STRING | data-mate also strips diacritics (ünïcödé→unicode); regex alone drifts |
| `toTitleCase` | STRING | as toCamelCase |
| `isFuture` | DATE | relative to now; non-deterministic |
| `isPast` | DATE | relative to now; non-deterministic |
| `isToday` | DATE | relative to current date; excluded from parity as non-deterministic |
| `isTomorrow` | DATE | relative to current date; non-deterministic |
| `isYesterday` | DATE | relative to current date; non-deterministic |
| `lookupTimezone` | DATE | lat/lon to timezone name; requires a timezone geo database DuckDB does not ship |
| `setDate` | DATE | replace day-of-month; overflow semantics differ from JS Date |
| `setHours` | DATE | replace hour; composition works but rollover semantics unverified |
| `setMilliseconds` | DATE | as setHours |
| `setMinutes` | DATE | as setHours |
| `setMonth` | DATE | replace month; make_timestamptz composition is expressible but day-overflow semantics differ |
| `setSeconds` | DATE | as setHours |
| `setTimezone` | DATE | attaches a fixed offset to the stored DateTuple; data-mate keeps the offset, TIMESTAMPTZ normalizes to UTC |
| `timezoneToOffset` | DATE | maps a zone name to an offset without a date; needs a reference instant |
| `toTimeZoneUsingLocation` | DATE | as lookupTimezone |
| `extractMappedIPv4` | IP | extracts the embedded v4 from a mapped v6 address |
| `getFirstUsableIPInCIDR` | IP | first usable excludes the network address; arithmetic on INET unverified |
| `getLastUsableIPInCIDR` | IP | last usable excludes broadcast; arithmetic on INET unverified |
| `intToIP` | IP | inverse of ipToInt |
| `ipToInt` | IP | data-mate returns an unbounded bigint; INET has no direct numeric cast in this build |
| `isNonRoutableIP` | IP | inverse of isRoutableIP |
| `isRoutableIP` | IP | checks against the reserved/private block tables |
| `reverseIP` | IP | reverses octet/hextet order as a string |
| `toCIDR` | IP | builds a CIDR from an address plus a suffix arg |
| `geoRelation` | GEO | dispatches on a relation-name arg; ST_Relate is absent from this build, though the individual predicates exist |
| `isGeoPoint` | GEO | accepts strings, [lon,lat] tuples and {lat,lon} objects; multi-shape, not one expression |
| `toGeoJSON` | GEO | accepts points/boundaries and emits GeoJSON; multi-shape input |
| `toGeoPoint` | GEO | parses several point encodings into {lat,lon} |
### 4.3 Approximations that need a parity decision (17)

A candidate exists and runs, but it is an approximation rather than a translation.
Shipping these silently would be a user-visible behaviour change, because via
`v3/type-defs/directives.ts:189-224` **every one of these function names is a QPL directive**.

| function | category | note |
|---|---|---|
| `isEmail` | STRING | APPROXIMATION - the validator library is stricter (rejects a@b..com, accepts quoted locals) |
| `isFQDN` | STRING | APPROXIMATION of validator.isFQDN |
| `isMACAddress` | STRING | APPROXIMATION; data-mate supports several delimiter styles |
| `isURL` | STRING | APPROXIMATION of validator.isURL |
| `formatDate` | DATE | format via a strftime-style pattern |
| `getTimezoneOffset` | DATE | offset in minutes |
| `isEpoch` | DATE | looks like epoch seconds |
| `isEpochMillis` | DATE | looks like epoch milliseconds |
| `toDate` | DATE | parse with an explicit format |
| `toTimeZone` | DATE | convert to a named zone |
| `getCIDRMax` | IP | last address in a CIDR |
| `getCIDRMin` | IP | first address in a CIDR |
| `getFirstIPInCIDR` | IP | first address |
| `getLastIPInCIDR` | IP | last address |
| `isMappedIPv4` | IP | IPv4-mapped IPv6 address |
| `geoPointWithinRange` | GEO | within a distance of a point |
| `isGeoJSON` | GEO | parses as GeoJSON |
### 4.4 Decisions that are not technical

| decision | why it is a judgement call |
|---|---|
| Keep or fix the multi-key sort (D1) | Fixing it changes results for any query using multiple sort keys. It is currently snapshotted as correct. |
| Keep or fix null ordering (D2) | The mechanism is wrong; where nulls *should* sort is a convention. |
| Unicode case-folding standard | JS full folding (`ß`→`SS`) vs SQL single-codepoint (`ẞ`). Neither is wrong. |
| Non-finite numeric results | data-mate nulls them; SQL propagates `inf`. |
| Coercion failure contract | Throw-the-batch vs null-the-value. Affects every ingest path. |
| Accept epoch-as-string dates | Real capability today (`'1710028800000'`), absent in `TRY_CAST`. Greppable whether production relies on it. |
| Leading-zero IPs | data-mate rejects `01.02.03.04`, DuckDB reads it as `1.2.3.4`. data-mate's strictness is the safer behaviour and should be kept deliberately. |


---

## Method and limits

- Generated by a throwaway script; only this document is committed.
- Deterministic: `TZ=UTC`, fixed LCG seeds, no `Date.now()`. Re-running produces byte-identical output.
- data-mate is exercised through its built `dist`, one value at a time, because both `fromJSON` and
  the adapter throw on the first bad value in a batch and would otherwise mask every later value.
- DuckDB expressions are wrapped in `TRY()` so a per-row error becomes `null` rather than aborting
  the statement — mirroring data-mate rejecting a single value.
- Batteries are adversarial by design and are **not** a sample of production data. A function marked
  ✅ exact is exact *over these inputs*; it is not a proof.
- `random` and the five now-relative date validators are excluded as non-deterministic.
