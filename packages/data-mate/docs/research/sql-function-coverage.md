# DuckDB 1.5.5 native function coverage — can our query language compile to SQL instead of JS UDFs?

Research date: 2026-08-18. Scope: date/timestamp, IP/CIDR, geo, JSON.

## Method and provenance

| Source | What it is |
|---|---|
| `raw.githubusercontent.com/duckdb/duckdb-web/main/docs/current/...` | Primary docs. `docs/current` **is** the 1.5 line (dir listing shows `0.10, 1.0, 1.1, 1.2, 1.3, current, lts`; `v1.5.5` is the newest release tag on `duckdb/duckdb`). |
| `raw.githubusercontent.com/duckdb/duckdb/v1.5.5/extension/icu/icu_extension.cpp` | ICU registration source, read at the exact tag. |
| `@duckdb/node-api` `1.5.5-r.3` (already a dependency of this package) | The actual engine. `SELECT version()` → `v1.5.5`, `source_id` `d8cdaa33fd`. Used for **metadata and semantics queries only** — `duckdb_functions()`, `duckdb_extensions()`, and single-row expression evaluation. No benchmarks were run. |

Every claim below is tagged:

- **[DOC]** — quoted from duckdb.org docs / DuckDB source.
- **[MEASURED]** — executed against DuckDB v1.5.5 via `@duckdb/node-api` 1.5.5-r.3 and the result pasted verbatim.
- **[INFERRED]** — reasoning, not directly stated or measured.

---

## 0. The gate that decides everything: which arguments may be per-row?

A function can only be compiled to SQL if the arguments our query language varies per row are arguments DuckDB accepts as non-constant. This turned out to be the sharpest dividing line in the whole investigation.

| Argument | Per-row column allowed? | Evidence |
|---|---|---|
| `strptime` / `try_strptime` **format** | **NO** | **[MEASURED]** `Invalid Input Error: strptime format must be a constant` |
| `strftime` **format** | **NO** | **[MEASURED]** `Invalid Input Error: strftime format must be a constant` |
| `date_part(part, ts)` **part** | YES | **[MEASURED]** `date_part(p, ts)` with `p` from a CTE column → `11` |
| `date_trunc(part, ts)` **part** | YES | **[MEASURED]** → `2021-08-03 11:00:00` |
| `date_diff(part, a, b)` **part** | YES | **[MEASURED]** → `31` |
| `date_part(['a','b'], ts)` struct form **list** | **NO** | **[DOC]** "Get the listed subfields as a `struct`. **The list must be constant.**" |
| `timezone(zone, ts)` / `AT TIME ZONE` **zone** | YES | **[MEASURED]** `timezone(z, ts)` with `z` from a column → `2025-07-15 21:00:00` |
| `time_bucket(width, ts, zone)` **zone** | YES | **[MEASURED]** per-row zones `Asia/Tokyo` / `America/New_York` both bucketed correctly |
| `json_extract(j, path)` **path** | YES | **[MEASURED]** `p` from a column → `1`, `2` |
| R-tree accelerated spatial predicate **query geometry** | **NO** | **[DOC]** "One of the arguments to the spatial predicate function must be a \"constant\" (i.e., an expression whose result is known at query planning time)." |

**Consequence [INFERRED]:** any function of ours whose *format string* is data-driven per row cannot be pure SQL. If the format is fixed at plan time (the normal case — the format comes from the query, not the data), it compiles fine. If a column holds per-row formats, the options are (a) a JS UDF, (b) a `CASE` over the distinct constant formats, or (c) `try_strptime(col, ['fmt1','fmt2',...])` with a constant candidate list, which covers "one of N known shapes" without a UDF.

By contrast, **part names, time zone names, and JSON paths are all safely per-row**, which is a much better position than expected.

---

## A) DATE / TIMESTAMP

### A1. Parsing

**[DOC]** from `sql/functions/timestamp.md`:

| Function | Documented description |
|---|---|
| `strptime(text, format)` | "Converts the string `text` to timestamp according to the format string. **Throws an error on failure.** To return `NULL` on failure, use `try_strptime`." |
| `strptime(text, format-list)` | "Converts the string `text` to timestamp applying the format strings **in the list until one succeeds**. Throws an error on failure. To return `NULL` on failure, use `try_strptime`." |
| `try_strptime(text, format)` | "Converts the string `text` to timestamp according to the format string. **Returns `NULL` on failure.**" |
| `try_strptime(text, format-list)` | "Converts the string `text` to timestamp applying the format strings in the list until one succeeds. **Returns `NULL` on failure.**" |
| `epoch_ms(timestamp)` | "Returns the total number of milliseconds since the epoch." |
| `epoch_us(timestamp)` / `epoch_ns(timestamp)` | "Returns the total number of microseconds / nanoseconds since the epoch." |
| `to_timestamp(double)` | "Converts seconds since the epoch to a timestamp with time zone." |
| `make_timestamp(bigint × 5, double)` | "The timestamp for the given parts." |
| `make_timestamp(microseconds)` | "Converts microseconds since the epoch to a timestamp." |
| `make_timestamp_ms(milliseconds)` | "Converts milliseconds since the epoch to a timestamp." |
| `make_timestamp_ns(nanoseconds)` | "Converts nanoseconds since the epoch to a timestamp." |

**[DOC]** documented list example: `strptime('4/15/2023 10:56:00', ['%d/%m/%Y %H:%M:%S', '%m/%d/%Y %H:%M:%S'])`.

**[DOC]** the `epoch` caveat: "Unlike `epoch_ms`, `epoch_us` and `epoch_ns`, which return `BIGINT`, `epoch` returns a `DOUBLE` and therefore retains sub-second precision."

**[MEASURED]** behaviours:

```
epoch_ms(1667810584123)                        -> 2022-11-07 08:43:04.123     (bigint -> TIMESTAMP; both directions exist)
epoch_ms(TIMESTAMP '2021-08-03 11:59:44.123456') -> 1627991984123
to_timestamp(1284352323.5)                     -> TIMESTAMPTZ
make_date(1992,9,20)                           -> 1992-09-20
make_timestamp(1992,9,20,13,34,27.123456)      -> 1992-09-20 13:34:27.123456
make_timestamp(1667810584123456)               -> 2022-11-07 08:43:04.123456
make_timestamp_ms(1667810584123)               -> 2022-11-07 08:43:04.123

try_strptime('4/15/2023 10:56:00', ['%d/%m/%Y %H:%M:%S','%m/%d/%Y %H:%M:%S']) -> 2023-04-15 10:56:00
try_strptime('not a date', ['%d/%m/%Y','%m/%d/%Y'])                           -> NULL
strptime('nope','%Y-%m-%d')  -> Invalid Input Error: Could not parse string "nope" according to format specifier "%Y-%m-%d"
```

**[MEASURED] return type flips with the format**: `try_strptime('2023-01-02','%Y-%m-%d')` → `TIMESTAMP`, but `try_strptime('2023-01-02 05:00:00 PST','%Y-%m-%d %H:%M:%S %Z')` → `TIMESTAMP WITH TIME ZONE`. Same for `%z`: `strptime('2021-08-03T11:59:44+0200','%Y-%m-%dT%H:%M:%S%z')` → `TIMESTAMP WITH TIME ZONE`. **[DOC]** confirms: "Converts string to `TIMESTAMP WITH TIME ZONE` according to the format string **if `%Z` is specified**."

> **This maps exactly onto our existing failure contract** (memory: *validations null, transforms THROW*). `try_strptime` = validation, `strptime` = transform. No UDF needed to get the contract right. **[INFERRED]**

Format specifier table: `docs/current/sql/functions/dateformat.md#format-specifiers` → <https://duckdb.org/docs/current/sql/functions/dateformat#format-specifiers>

### A2. Formatting

**[DOC]** `strftime(timestamp, format)` — "Converts timestamp to string according to the format string."

Sub-second specifiers, quoted verbatim from the format specifier table:

| Specifier | Description | Example |
|---|---|---|
| `%f` | "Microsecond as a decimal number, zero-padded on the left." | 000000 - 999999 |
| `%g` | "Millisecond as a decimal number, zero-padded on the left." | 000 - 999 |
| `%n` | "Nanosecond as a decimal number, zero-padded on the left." | 000000000 - 999999999 |
| `%c` | "ISO date and time representation" | 1992-03-02 10:30:20 |
| `%x` | "ISO date representation" | 1992-03-02 |
| `%X` | "ISO time representation" | 10:30:20 |
| `%z` | "Time offset from UTC in the form ±HH:MM, ±HHMM, or ±HH." | -0700 |
| `%Z` | "Time zone name." | Europe/Amsterdam |
| `%G` | "ISO 8601 year with century representing the year that contains the greater part of the ISO week (see `%V`)." | 0001 … 9999 |
| `%V` | "ISO 8601 week as a decimal number with Monday as the first day of the week. Week 01 is the week containing Jan 4. **Note that `%V` is incompatible with year directive `%Y`. Use the ISO year `%G` instead.**" | 01 … 53 |
| `%u` | "ISO 8601 weekday as a decimal number where 1 is Monday." | 1 … 7 |
| `%U` / `%W` | Sunday-/Monday-anchored week numbers; both carry "Note that this is not compliant with the week date standard in ISO 8601." | 00 … 53 |
| `%y` | "Year without century… Numbers 00 to 68 are turned into 2000 to 2068. Numbers 69 to 99 are turned into 1969 to 1999." | 00 … 99 |

Also present: `%a %A %b %B %d %-d %H %-H %I %-I %j %-j %m %-m %M %-M %p %S %-S %w %Y %%`. The `%-` prefix is the no-zero-padding variant.

**ISO-8601 output** has no single specifier — it must be composed. **[MEASURED]**:

```sql
strftime(TIMESTAMP '2021-08-03 11:59:44.123456', '%Y-%m-%dT%H:%M:%S.%gZ')  -- -> 2021-08-03T11:59:44.123Z
strftime(... , '%Y-%m-%dT%H:%M:%S.%fZ')                                    -- -> 2021-08-03T11:59:44.123456Z
'2021-08-03T11:59:44.123Z'::TIMESTAMPTZ                                    -- parses natively, no format needed
```

### A3. Truncation and parts

**[DOC]** `date_trunc(part, timestamp)` — "Truncate to specified precision." `date_part(part, timestamp)` — "Get subfield (equivalent to `extract`)." `date_diff(part, start, end)` — "The number of `part` boundaries between `start` and `end`, inclusive of the larger timestamp and exclusive of the smaller timestamp." `date_sub(part, start, end)` — "The signed length of the interval between `start` and `end`, truncated to whole multiples of `part`." `last_day(timestamp)` — "The last day of the month." `dayname(timestamp)` — "The (English) name of the weekday." `monthname(timestamp)` — "The (English) name of the month."

**[DOC]** part specifiers usable **both** as date parts and in intervals: `century, day, decade, hour, microseconds, millennium, milliseconds, minute, month, quarter, second, year` (each with synonyms, e.g. `day` → `days, d, dayofmonth`).

**[DOC]** part specifiers **only** usable as date parts: `dayofweek` (Sunday = 0), `dayofyear`, `epoch`, `era`, `isodow` (Monday = 1), `isoyear`, `julian`, `timezone_hour`, `timezone_minute`, `timezone`, `week`, `yearweek`.

**[DOC]** "Except for `julian` and `epoch`, which return `DOUBLE`s, all parts are extracted as integers. Since there are no infinite integer values in DuckDB, `NULL`s are returned for infinite timestamps."

**[MEASURED]** `date_trunc` accepted every part I tried on `TIMESTAMP '2021-08-03 11:59:44.123456'`:

```
millennium  -> 2000-01-01 00:00:00      day          -> 2021-08-03 00:00:00
century     -> 2000-01-01 00:00:00      hour         -> 2021-08-03 11:00:00
decade      -> 2020-01-01 00:00:00      minute       -> 2021-08-03 11:59:00
year        -> 2021-01-01 00:00:00      second       -> 2021-08-03 11:59:44
quarter     -> 2021-07-01 00:00:00      milliseconds -> 2021-08-03 11:59:44.123
month       -> 2021-08-01 00:00:00      microseconds -> 2021-08-03 11:59:44.123456
week        -> 2021-08-02 00:00:00      isoyear      -> 2021-01-04 00:00:00
yearweek    -> 2021-08-02 00:00:00      dayofweek    -> 2021-08-03 00:00:00
epoch       -> 2021-08-03 11:59:44
```

**[MEASURED]** `dayname(TIMESTAMP '1992-03-22')` → `Sunday`; `monthname(TIMESTAMP '1992-09-20')` → `September`; `last_day(DATE '1992-02-05')` → `1992-02-29`; `date_add(DATE '1992-09-20', INTERVAL 1 MONTH)` → `1992-10-20 00:00:00`; `date_diff('day', DATE '1992-09-20', DATE '1992-10-01')` → `11`. Month-end clamping works: `date_add(DATE '2021-01-31', INTERVAL 1 MONTH)` → `2021-02-28`.

**[MEASURED] doc bug worth knowing:** `datepart.md` lists the `timezone` part as "Time zone offset **in seconds**" in the specifier table, but the dedicated-function entry for `timezone(date)` says "Time zone offset **in minutes**". The engine returns **seconds**: `date_part('timezone', TIMESTAMPTZ '2025-07-15 12:00:00+00')` → `-25200` under a `-07:00` session zone. Treat the specifier table as correct.

---

### A4. THE CRUX — time zones via the `icu` extension

**[DOC]** `sql/functions/timestamptz.md`: "Time zone support is provided by the built-in ICU extension." `core_extensions/icu.md`: "The `icu` extension contains an easy-to-use version of the collation/timezone part of the ICU library."

**[DOC]** `AT TIME ZONE` is sugar: "The `AT TIME ZONE` syntax is syntactic sugar for the (two argument) `timezone` function listed above." The two directions, quoted:

- `timezone(text, timestamp)` — "Use the date parts of the timestamp in GMT to construct a timestamp in the given time zone. Effectively, the argument is a \"local\" time." → returns **TIMESTAMPTZ**.
- `timezone(text, timestamptz)` — "Use the date parts of the timestamp in the given time zone to construct a timestamp. Effectively, the result is a \"local\" time." → returns **naive TIMESTAMP**.

**[DOC]** "Note that numeric timezones are not allowed": `TIMESTAMP '2001-02-16 20:38:40' AT TIME ZONE '0200'` → `Not implemented Error: Unknown TimeZone '0200'`. Named zones (or `UTC`) only.

**[DOC]** `SET TimeZone` is an ICU-registered extension option. Config table: `TimeZone` — "The current time zone", `VARCHAR`, default **"System (locale) timezone"**; `Calendar` — "The current calendar", default "System (locale) calendar". Source confirms **[DOC]**: `config.AddExtensionOption("TimeZone", "The current time zone", LogicalType::VARCHAR, Value(tz_string), SetICUTimeZone);` (`extension/icu/icu_extension.cpp:499`).

**[MEASURED] the default session zone is the machine's**: on this box `SELECT current_setting('TimeZone')` → `America/Phoenix`, `current_setting('Calendar')` → `gregorian`. So *any* TIMESTAMPTZ-shaped behaviour is machine-dependent unless we pin it.

#### `duckdb_timezones()` does **not** exist

**[MEASURED]**:

```
SELECT count(*) FROM duckdb_timezones();
  -> Catalog Error: Table Function with name duckdb_timezones does not exist!
SELECT count(*) FROM pg_timezone_names();
  -> 638
```

**[DOC]** the docs only ever name `pg_timezone_names()`: "An up-to-date version of this list can be pulled from the `pg_timezone_names()` table function: `SELECT name, abbrev FROM pg_timezone_names() ORDER BY name;`". **[DOC]** the ICU source also registers `icu_calendar_names` (`icu_extension.cpp:520`). **Use `pg_timezone_names()`** to validate zone names against the engine.

#### (a) Getting the UTC offset for a given instant in a given named zone, DST-aware and per-row

**There is no single native function for this.** `date_part('timezone', ...)` looks like the answer and is not — it reports the **session** zone's offset only.

**[MEASURED]** under `TimeZone = America/Phoenix` (no DST):

```
date_part('timezone',       TIMESTAMPTZ '2025-07-15 12:00:00+00') -> -25200   (seconds)
date_part('timezone_hour',  TIMESTAMPTZ '2025-07-15 12:00:00+00') -> -7
date_part('timezone_minute',TIMESTAMPTZ '2025-07-15 12:00:00+00') -> 0
-- January and July are identical: -25200 / -25200   (Phoenix has no DST)
```

**[MEASURED]** it *is* DST-aware, but only for whatever the session zone happens to be — under `SET TimeZone='America/New_York'`:

```
date_part('timezone', TIMESTAMPTZ '2025-01-15 12:00:00+00') -> -18000   (EST)
date_part('timezone', TIMESTAMPTZ '2025-07-15 12:00:00+00') -> -14400   (EDT)
```

**The working per-row idiom** is a round trip through the naive wall clock. `ts AT TIME ZONE zone` gives the wall clock in `zone` as a naive TIMESTAMP; re-reading that naive value as UTC yields an instant displaced from `ts` by exactly the offset:

```sql
date_diff('second', ts, (ts AT TIME ZONE zone) AT TIME ZONE 'UTC') AS offset_seconds
```

**[MEASURED]** with `zone` coming from a **column**:

| zone | offset_seconds | wall clock |
|---|---:|---|
| `America/New_York` (2025-01-15T12:00Z) | `-18000` | 2025-01-15 07:00:00 |
| `America/New_York` (2025-07-15T12:00Z) | `-14400` | 2025-07-15 08:00:00 |
| `Asia/Kolkata` | `19800` | 2025-07-15 17:30:00 |
| `Australia/Lord_Howe` | `37800` | 2025-07-15 22:30:00 |
| `UTC` | `0` | 2025-07-15 12:00:00 |

DST-aware (EST vs EDT differ), correct for half-hour zones (Kolkata +05:30) and for the +10:30 Lord Howe case, and **fully per-row** — the zone is a column. This is the primitive to generate. **[MEASURED]**

#### (b) Shifting an instant between two named zones

Two different operations, both native:

1. **Same instant, read in another zone** (rendering) — `ts AT TIME ZONE zone` → naive wall clock. **[MEASURED]** for `TIMESTAMPTZ '2025-07-15 12:00:00+00'`: `America/New_York` → `2025-07-15 08:00:00`, `Asia/Tokyo` → `2025-07-15 21:00:00`, `Europe/Paris` → `2025-07-15 14:00:00`. Zones from a column.
2. **Reinterpret a wall clock from zone A into zone B** — chain the two `timezone` overloads:

```sql
(naive AT TIME ZONE zoneA) AT TIME ZONE zoneB
```

**[MEASURED]** `TIMESTAMP '2025-07-15 09:30:00'`, A = `America/New_York`, B = `Asia/Tokyo` → `2025-07-15 22:30:00`. Both zones from columns.

**[DOC]** DST edge behaviour on interval arithmetic: "When adding calendar intervals such as `INTERVAL '1 day'` to a `TIMESTAMPTZ`, the resulting local timestamp may fall on a non-existent time during daylight saving time transitions. DuckDB follows PostgreSQL behavior and adjusts the result forward to the next valid timestamp." Example given: under `Europe/Amsterdam`, `TIMESTAMPTZ '2025-03-29 02:30:00+01' + INTERVAL '1 day'` → `2025-03-30 03:30:00+02`.

**[DOC]** interval arithmetic uses the ICU calendar: "Addition and subtraction of intervals uses the ICU Calendar add function. For positive intervals (forwards in time) the fields are incremented from least to most significant. For negative intervals (backwards in time) the fields are decremented from most to least significant. This produces the same results as Postgres, but does not match some more recent calendar RFCs."

#### (c) Does rendering a TIMESTAMPTZ depend on session state? **Yes — and there is a second, worse trap in the driver.**

**[DOC]** "With no time zone extension loaded, `TIMESTAMPTZ` values will be cast to and from strings using offset notation… For portability, `TIMESTAMPTZ` values will always be displayed using GMT offsets." And with ICU loaded: `SELECT '2022-10-08 13:13:34 Europe/Amsterdam'::TIMESTAMPTZ::VARCHAR;` → `2022-10-08 04:13:34-07` with the comment "**-- the offset will differ based on your local time zone**".

**[MEASURED]** server-side rendering follows `SET TimeZone`, for the identical input value:

| Session `TimeZone` | `TIMESTAMPTZ '2025-07-15 12:00:00+00'::VARCHAR` | `strftime(ts,'%Y-%m-%dT%H:%M:%S%z')` |
|---|---|---|
| `America/New_York` | `2025-07-15 08:00:00-04` | `2025-07-15T08:00:00-04` |
| `Asia/Tokyo` | `2025-07-15 21:00:00+09` | `2025-07-15T21:00:00+09` |

**[MEASURED]** binning is session-dependent too — under `Asia/Tokyo`, `date_trunc('day', TIMESTAMPTZ '2025-07-15 12:00:00+00')` truncates to Tokyo midnight (`2025-07-15 00:00+09` = `2025-07-14 15:00Z`), not UTC midnight.

**[MEASURED] driver-level trap:** `@duckdb/node-api` 1.5.5-r.3 renders a returned TIMESTAMPTZ using the zone captured when the *instance* was created, **ignoring the current session `TimeZone`**. In the same two sessions above, the raw returned value was `2025-07-15 05:00:00-07` (Phoenix, the instance default) in **both**, while the server-side `::VARCHAR` cast correctly gave `-04` and `+09`. Same effect on `to_timestamp(1284352323.5)`, which came back `-07` even under `SET TimeZone='UTC'`.

**How to make output independent of session state** — all **[MEASURED]** under `TimeZone='Asia/Tokyo'`, all returning the same answer regardless of session:

```sql
-- 1. convert to naive UTC, then format (recommended)
strftime(ts AT TIME ZONE 'UTC', '%Y-%m-%dT%H:%M:%S.%gZ')   -- -> 2025-07-15T12:00:00.123Z
strftime(ts AT TIME ZONE 'UTC', '%Y-%m-%dT%H:%M:%S.%fZ')   -- -> 2025-07-15T12:00:00.123456Z
(ts AT TIME ZONE 'UTC')::VARCHAR                           -- -> 2025-07-15 12:00:00.123456

-- 2. instants are inherently session-free
epoch_ms(ts)                                               -- -> 1752580800123

-- 3. bin with an explicit zone instead of the session zone
time_bucket(INTERVAL '1 day', ts, 'UTC')                   -- -> 2025-07-15 00:00:00Z
```

**Three rules for the SQL generator [INFERRED, from the measurements above]:**

1. `SET TimeZone='UTC'` on every connection — never inherit the machine's zone.
2. Never return a bare TIMESTAMPTZ to JS. Render server-side with `AT TIME ZONE 'UTC'` + `strftime`, or return `epoch_ms`.
3. For any zone-sensitive truncation, use `time_bucket(width, ts, zone)` — **[MEASURED]** its `zone` argument accepts a column, so it is the per-row, session-independent alternative to `date_trunc` on a TIMESTAMPTZ.

### A5. Does `icu` autoload? Yes.

**[DOC]** "The `icu` extension will be transparently **autoloaded on first use** from the official extension repository. If you would like to install and load it manually, run: `INSTALL icu; LOAD icu;`"

**[MEASURED]** in `@duckdb/node-api` 1.5.5-r.3 it is already resolved at connection open — before any time zone expression is evaluated:

```
duckdb_extensions() -> icu:  loaded=true, installed=true, install_mode=REPOSITORY
                       json: loaded=true, installed=true, install_mode=REPOSITORY
                       inet: loaded=false, installed=true, install_mode=REPOSITORY
                       spatial: loaded=false, installed=true, install_mode=REPOSITORY
                       core_functions: loaded=true, STATICALLY_LINKED
```

`install_mode=REPOSITORY` means it was downloaded, not statically linked — so a first-ever run needs the extension directory populated or network access. **[INFERRED]**

**[MEASURED] autoload is not uniform**: `inet` autoloads on first use (`host('192.168.1.5/24'::INET)` worked with no `LOAD`, and flipped `loaded` to true), but **`spatial` does not autoload**:

```
SELECT ST_Point(1,2)
  -> Catalog Error: Scalar Function with name "st_point" is not in the catalog,
     but it exists in the spatial extension.
-- and spatial.loaded remained false afterwards
```

So `LOAD spatial` must be explicit.

### A) No native equivalent

- **Per-row (data-driven) format strings** for `strptime`/`strftime` — hard engine restriction. Constant, or a constant list, or a UDF.
- **A single-call "offset of instant in named zone"** — must be expressed as the `date_diff`/double-`AT TIME ZONE` round trip in (a). Nothing like PostgreSQL's `utc_offset` column per row.
- **`duckdb_timezones()`** — does not exist; `pg_timezone_names()` is the function.
- **Epoch-seconds format specifier** (`%s`) — absent from the specifier table; use `epoch`/`epoch_ms`.
- **A one-shot ISO-8601 formatter** — compose `'%Y-%m-%dT%H:%M:%S.%gZ'` yourself. (`%c`/`%x`/`%X` are space-separated ISO, not `T`-separated with `Z`.)
- **Relative/humanised durations** ("3 days ago") — `age()` returns an INTERVAL struct (`{months, days, micros}`), not prose.
- **Locale-aware month/day names** — `dayname`/`monthname` are documented as "**The (English) name**". Non-English needs a UDF or a lookup table.
- **Business-day / calendar arithmetic** (add N weekdays, holiday calendars) — nothing native.
- **Fuzzy / heuristic date parsing** (no format supplied, guess the shape) — nothing native; `try_strptime` with a candidate list is the closest and requires the list up front.

---

## B) IP / CIDR — the `inet` core extension

**[DOC]** "The `inet` extension defines the `INET` data type for storing IPv4 and IPv6 Internet addresses. It supports the CIDR notation for subnet masks (e.g., `198.51.100.0/22`, `2001:db8:3c4d::/48`)." Autoloaded on first use (confirmed **[MEASURED]**, §A5). Repo: `github.com/duckdb/duckdb-inet`.

**[MEASURED]** the complete native surface — every function in `duckdb_functions()` touching `INET`:

```
host(INET)      -> VARCHAR
netmask(INET)   -> INET
network(INET)   -> INET
broadcast(INET) -> INET
+(INET, HUGEINT) -> INET
-(INET, HUGEINT) -> INET
```

plus the operators `<<=`, `>>=`, ordinary comparison/ordering, and the unrelated `html_escape` / `html_unescape` that ship in the same extension. **That is all.**

**[DOC]** descriptions: `host` — "The host component of an `INET` value can be extracted using the `HOST()` function." `netmask` — "Computes the network mask for the address's network." `network` — "Returns the network part of the address, zeroing out whatever is to the right of the netmask." `broadcast` — "Computes the broadcast address for the address's network." `<<=` — "Is subnet contained by or equal to subnet?" `>>=` — "Does subnet contain or equal subnet?" Ordering — "`INET` values can be compared naturally, and IPv4 will sort before IPv6. Additionally, IP addresses can be modified by adding or subtracting integers."

**[MEASURED]**:

```
host(INET '192.168.1.5/24')                          -> 192.168.1.5
network('192.168.1.5/24'::INET)::VARCHAR             -> 192.168.1.0/24
broadcast('192.168.1.5/24'::INET)::VARCHAR           -> 192.168.1.255/24
netmask('192.168.1.5/24'::INET)::VARCHAR             -> 255.255.255.0/24
INET '192.168.1.5/32' <<= INET '192.168.1.0/24'      -> true
INET '192.168.0.0/16' >>= INET '192.168.1.0/24'      -> true
INET '2001:db8::1' > INET '192.168.1.1'              -> true    (IPv4 sorts before IPv6)
INET '2001:db8:3c4d:15::1a2f:1a2b' <<= INET '2001:db8:3c4d::/48' -> true   (IPv6 CIDR containment)
```

**IPv6: fully supported** — type, CIDR notation, containment, ordering, and `netmask`/`network`/`broadcast` all documented with IPv6 examples and confirmed **[MEASURED]**.

**Validation is via `TRY_CAST` only. [MEASURED]**

```
TRY_CAST('not-an-ip'      AS INET) -> NULL
TRY_CAST('999.1.1.1'      AS INET) -> NULL
TRY_CAST('192.168.1.0/33' AS INET) -> NULL
'999.1.1.1'::INET -> Conversion Error: Failed to convert string "999.1.1.1" to inet:
                     Expected a number between 0 and 255
```

There is no `is_valid_inet()` predicate — `TRY_CAST(x AS INET) IS NOT NULL` is the idiom. This again lines up with our validate-vs-transform contract: `TRY_CAST` nulls, `CAST` throws. **[INFERRED]**

**[MEASURED] driver trap:** `netmask`/`network`/`broadcast` return `INET`, which `@duckdb/node-api` surfaces as a raw struct — `{"ip_type":1,"address":"4294967040","mask":24}` — and the `address` can come back **negative** (`-1062731265` for the `192.168.1.255/24` broadcast). Always `::VARCHAR` server-side, as in the measurements above.

**MAC addresses: nothing, anywhere. [MEASURED]**

```
SELECT function_name FROM duckdb_functions()
 WHERE function_name ILIKE '%mac%' OR ILIKE '%eui%' OR ILIKE '%macaddr%';  -> [] (empty)
SELECT type_name FROM duckdb_types()
 WHERE type_name ILIKE '%mac%' OR '%inet%' OR '%cidr%';                    -> INET only
```

No `MACADDR`/`MACADDR8` type (unlike PostgreSQL), no MAC functions, in core or in `inet`.

### B) No native equivalent

- **MAC / EUI-48 / EUI-64** — no type, no functions, no validation. UDF or VARCHAR + regex.
- **IPv4 vs IPv6 discrimination** — no `family()` / `version()`. Workaround **[INFERRED]**: test `x <<= INET '::/0'` style containment, or `contains(host(x), ':')`. The driver's `ip_type` field is internal, not a SQL accessor.
- **Prefix-length accessor** — no `masklen()`; no `set_masklen()` to rewrite a prefix.
- **`abbrev()`, `inet_merge()`, `inet_same_family()`** — the PostgreSQL companions are all absent.
- **IP ↔ integer conversion** — no `inet_aton`/`inet_ntoa`. `+`/`-` take a HUGEINT offset but there is no cast to a bare numeric.
- **Private / reserved / special-range classification** (RFC1918, loopback, link-local, multicast) — must be built as a disjunction of `<<=` tests against a constant CIDR list. That *is* generatable SQL and does not need a UDF. **[INFERRED]**
- **CIDR enumeration / expansion** to a row per host — no set-returning function; would need `range()` + `+` arithmetic. **[INFERRED]**
- **Reverse DNS / PTR / ASN or geo-IP enrichment** — out of scope for the extension entirely.

---

## C) GEO

### `GEOMETRY` is built in as of v1.5, but its functions mostly are not

**[DOC]** `sql/data_types/geometry.md`: "The `GEOMETRY` type was part of the `spatial` extension but **became a built-in data type in DuckDB v1.5**. Most of the benefits of having `GEOMETRY` as a built-in type (e.g., storage optimizations, statistics, etc.) are therefore **only available in databases using storage version v1.5 and above**. However, **almost all of the associated functions** for working with geometries (e.g., calculating distances, areas, intersections) **are still part of `spatial`**."

**[DOC]** the built-in function set is only six functions plus one operator: `ST_GeomFromWKB`, `ST_AsWKB` (alias `ST_AsBinary`), `ST_AsWKT` (alias `ST_AsText`), `ST_Intersects_Extent` (alias `&&`, "Returns true if the geometries bounding boxes intersect"), `ST_CRS`, `ST_SetCRS`.

**[MEASURED]** confirming the split — with `spatial` *not* loaded:

```
'POINT(1 2)'::GEOMETRY::VARCHAR        -> POINT (1 2)      -- built-in type works
ST_AsWKT('POINT(1 2)'::GEOMETRY)       -> POINT (1 2)      -- built-in function works
ST_Point(1,2)                          -> Catalog Error … exists in the spatial extension
```

### Storage-version dependency

**[DOC]** "Internally `GEOMETRY` values are stored as a sequence of bytes… **The exact binary format is not yet stabilized and may change in a future release**, but as of DuckDB storage version v1.5 it is based on little-endian Well-Known Binary (WKB)… In older storage versions, geometries were stored in a different custom binary format used by the `spatial` extension, but this conversion is performed automatically at the storage layer and is not visible to the execution engine or the user."

**[DOC]** the optimisation that needs v1.5 storage: "shredding, which improves compression for geometry columns where all values share the same geometry type and vertex dimensions" (docs show 2.2 MiB vs ~3× larger). And statistics: "Persisting geometry statistics is only possible in **storage versions v1.5 and above**, and so if you are using an older storage version, the geometry statistics will turn into \"unknown\" statistics when checkpointing… the bounding box will be set to an infinitely large bounding box… which means that the execution engine will not be able to do any optimizations based on the geometry statistics." Opt in with `ATTACH 'geometry_db.db' AS geometry_db (STORAGE_VERSION 'v1.5.0');`.

**[DOC]** CRS: geometries are Cartesian to the engine unless a CRS parameter is attached (`GEOMETRY('OGC:CRS84')`); `spatial` "registers over 7000 CRSs from the EPSG Geodetic Parameter Dataset"; unknown CRS identifiers make the statement fail unless `SET ignore_unknown_crs = true`; list them with `duckdb_coordinate_systems()`. "It is currently not possible to define a custom CRS from within SQL."

### The predicates we need (all from `spatial`)

**[DOC]** signatures and descriptions:

| Function | Signature(s) | Description |
|---|---|---|
| `ST_Point` | `GEOMETRY ST_Point(x DOUBLE, y DOUBLE)` | "Creates a GEOMETRY point" |
| `ST_Within` | `BOOLEAN ST_Within(POINT_2D, POLYGON_2D)` / `(GEOMETRY, GEOMETRY)` | "Returns true if the first geometry is within the second" |
| `ST_Contains` | `BOOLEAN ST_Contains(POLYGON_2D, POINT_2D)` / `(GEOMETRY, GEOMETRY)` | "Returns true if the first geometry contains the second geometry" |
| `ST_Intersects` | `BOOLEAN ST_Intersects(BOX_2D, BOX_2D)` / `(GEOMETRY, GEOMETRY)` | "Returns true if the geometries intersect" |
| `ST_MakeEnvelope` | `GEOMETRY ST_MakeEnvelope(min_x, min_y, max_x, max_y DOUBLE)` | "Create a rectangular polygon from min/max coordinates" |
| `ST_DWithin` | `BOOLEAN ST_DWithin(GEOMETRY, GEOMETRY, distance DOUBLE)` | "Returns if two geometries are within a target distance of each-other" |
| `ST_Distance` | `DOUBLE ST_Distance(GEOMETRY, GEOMETRY)` (+ POINT_2D/LINESTRING_2D overloads) | "Returns the planar distance between two geometries" |
| `ST_Distance_Sphere` | `DOUBLE ST_Distance_Sphere(GEOMETRY, GEOMETRY)` / `(POINT_2D, POINT_2D)` | "Returns the haversine (great circle) distance between two geometries. • Only supports POINT geometries. • **Returns the distance in meters.** • The input is expected to be in WGS84 (EPSG:4326) coordinates, using a **[latitude, longitude] axis order**." |
| `ST_DWithin_Spheroid` | `BOOLEAN ST_DWithin_Spheroid(POINT_2D, POINT_2D, distance DOUBLE)` | "Returns if two POINT_2D's are within a target distance **in meters**, using an ellipsoidal model of the earths surface" — "assumed to be in the EPSG:4326 coordinate system (WGS84), with **[latitude, longitude] axis order**… uses the GeographicLib library… highly accurate… **but is also the slowest**." |
| `ST_Distance_Spheroid` | `DOUBLE ST_Distance_Spheroid(POINT_2D, POINT_2D)` | same ellipsoidal model, metres |
| `ST_Extent` | `BOX_2D ST_Extent(GEOMETRY)` | "Returns the minimal bounding box enclosing the input geometry" |

**[MEASURED]** after `LOAD spatial`:

```
ST_Within(ST_Point(5,5), ST_MakeEnvelope(0,0,10,10))    -> true    -- point in bbox
ST_Contains(ST_MakeEnvelope(0,0,10,10), ST_Point(5,5))  -> true
ST_Intersects(ST_Point(5,5), ST_MakeEnvelope(0,0,10,10))-> true
ST_DWithin(ST_Point(0,0), ST_Point(3,4), 5.0)           -> true    -- PLANAR, units = degrees
ST_Distance(ST_Point(0,0), ST_Point(3,4))               -> 5       -- PLANAR
```

### ⚠ Axis order: documented **and** confirmed — the metric functions want (lat, lon)

**[MEASURED]** NYC (−74.0060, 40.7128) ↔ London (−0.1276, 51.5072); the true great-circle distance is ≈ 5,570 km:

```
ST_Distance_Sphere(ST_Point(-74.0060,40.7128), ST_Point(-0.1276,51.5072))  -> 8247212.76 m   ✗ WRONG
ST_Distance_Sphere(ST_Point( 40.7128,-74.0060), ST_Point(51.5072,-0.1276)) -> 5570242.31 m   ✓ CORRECT
```

So the docs are right: for `ST_Distance_Sphere`, `ST_Distance_Spheroid`, and `ST_DWithin_Spheroid` you must pass **`ST_Point(lat, lon)`** — the opposite of the (lon, lat) order used by `ST_Point` for planar work, by WKT, and by GeoJSON. A short-radius test is *not* diagnostic (both orders returned "within 500 m" for two adjacent points), which makes this an easy bug to ship. `ST_FlipCoordinates` exists **[MEASURED]** and is the clean way to convert. **This is the single highest-risk item in the geo area. [INFERRED]**

### Converting a lat/lon STRUCT to GEOMETRY

**[MEASURED]** three routes, all working, from `{'lat': 40.7128, 'lon': -74.0060}`:

```sql
ST_Point(loc.lon, loc.lat)                                        -- -> POINT (-74.006 40.7128)   ← preferred
ST_GeomFromText('POINT(' || loc.lon || ' ' || loc.lat || ')')     -- -> POINT (-74.006 40.7128)   (string building; slower)
{'x': loc.lon, 'y': loc.lat}::POINT_2D                            -- -> POINT_2D struct, for the *_Spheroid overloads
```

The third is the one to use for `ST_DWithin_Spheroid` / `ST_Distance_Spheroid`, whose only overload is `POINT_2D` — and remember to put **lat in `x`** for those. `ST_Point2D`, `ST_Point3D`, `ST_Point4D` also exist **[DOC]**.

### R-tree index requirements

**[DOC]** verbatim limitations:

- "The R-tree index is **only supported for the `GEOMETRY` data type**."
- "The R-tree index will only be used to perform \"index scans\" when the table is filtered (using a `WHERE` clause) with one of the following spatial predicate functions (as they all imply intersection): `ST_Equals`, `ST_Intersects`, `ST_Touches`, `ST_Crosses`, `ST_Within`, `ST_Contains`, `ST_Overlaps`, `ST_Covers`, `ST_CoveredBy`, `ST_ContainsProperly`."
- "**One of the arguments to the spatial predicate function must be a \"constant\"** (i.e., an expression whose result is known at query planning time). This is because the query planner needs to know the bounding box of the query region *before* the query itself is executed to use the R-tree index scan."
- Creation: `CREATE INDEX my_idx ON my_table USING RTREE (geom);`, options via `WITH (max_node_capacity = 16)`.

**Note what is missing from that predicate list: `ST_DWithin` and every `*_Sphere`/`*_Spheroid` function.** A radius query is therefore **not** index-accelerated as written. The generatable pattern is a constant bbox pre-filter (which *does* hit the index) conjoined with the exact metric test **[INFERRED]**:

```sql
WHERE ST_Within(geom, ST_MakeEnvelope(?, ?, ?, ?))   -- index scan, constant envelope
  AND ST_Distance_Sphere(geom, ST_Point(?lat, ?lon)) <= ?radius_m   -- exact, metres
```

### C) No native equivalent

- **Radius-in-metres over `GEOMETRY` in one call.** **[MEASURED]** signature sweep: `ST_DWithin(GEOMETRY, GEOMETRY, DOUBLE)` and `ST_DWithin_GEOS` are **planar** (degrees); the only metric `DWithin` is `ST_DWithin_Spheroid`, whose sole overload is `POINT_2D, POINT_2D, DOUBLE`. Metric radius on a `GEOMETRY` column needs `ST_Distance_Sphere(...) <= r` instead.
- **Index-accelerated radius or nearest-neighbour** — `ST_DWithin` is not in the R-tree predicate list; there is no KNN operator. Bbox pre-filter + exact test.
- **Per-row query geometries with index acceleration** — the constant requirement forbids it; a geometry-vs-geometry join falls back to a scan.
- **Geohash** — **[MEASURED]** no `%geohash%` function exists in `spatial`. `ST_QuadKey` is the only tile-key function. Geohash encode/decode must stay a UDF.
- **H3** — not in `spatial` (community extension territory, unverified).
- **Custom CRS definition from SQL** — **[DOC]** "It is currently not possible to define a custom CRS from within SQL, or to persist custom CRS definitions in a database."
- **Stable on-disk geometry encoding** — **[DOC]** "The exact binary format is not yet stabilized and may change in a future release." Do not persist raw `GEOMETRY` bytes as a wire format; use WKB explicitly.
- **`spatial` autoloading** — **[MEASURED]** it does not; `LOAD spatial` must be explicit.

---

## D) JSON

**[DOC]** extraction table, verbatim:

| Function | Aliases | Operator | Description |
|---|---|---|---|
| `json_exists(json, path)` | | | "Returns `true` if the supplied path exists in the `json`, and `false` otherwise." |
| `json_extract(json, path)` | `json_extract_path` | `->` | "Extracts `JSON` from `json` at the given `path`. If `path` is a `LIST`, the result will be a `LIST` of `JSON`." |
| `json_extract_string(json, path)` | `json_extract_path_text` | `->>` | "Extracts `VARCHAR` from `json` at the given `path`. If `path` is a `LIST`, the result will be a `LIST` of `VARCHAR`." |
| `json_value(json, path)` | | | "Extracts `JSON` from `json` at the given `path`. **If the `json` at the supplied path is not a scalar value, it will return `NULL`.**" |

**[DOC]** "Warning DuckDB's JSON data type uses **0-based indexing**." Path syntax supports both JSONPath (`'$.family'`, `'$.species[0]'`) and bare keys (`'family'`), and chaining (`j->'species'->>0`).

**[DOC]** scalar functions: `json_array_length(json[, path])` — "Return the number of elements in the JSON array `json`, or `0` if it is not a JSON array." `json_contains(json_haystack, json_needle)`. `json_keys(json[, path])` — "Returns the keys of `json` as a `LIST` of `VARCHAR`." `json_structure(json)` — "Return the structure of `json`. Defaults to `JSON` if the structure is inconsistent." `json_type(json[, path])` — "Return the type of the supplied `json`, which is one of `ARRAY`, `BIGINT`, `BOOLEAN`, `DOUBLE`, `OBJECT`, `UBIGINT`, `VARCHAR` and `NULL`." `json_valid(json)` — "Return whether `json` is valid JSON."

**[DOC]** nested-type conversion: `json_transform(json, structure)` — "Transform `json` according to the specified `structure`"; `from_json` — "Alias for `json_transform`"; `json_transform_strict` — "Same as `json_transform`, but **throws an error when type casting fails**"; `from_json_strict` — alias of the strict form.

**[DOC]** table functions: `json_each(json[, path])` — "Traverse `json` and return one row for each element in the top-level array or object." `json_tree(json[, path])` — "Traverse `json` in depth-first fashion and return one row for each element in the structure."

**[DOC]** aggregates: `json_group_array`, `json_group_object`, `json_group_structure`.

**[MEASURED]**:

```
j->'family'                      -> "anatidae"    (JSON, quoted)
j->>'family'                     -> anatidae      (VARCHAR, unquoted)
json_extract(j,'$.species[0]')   -> "duck"
json_extract_string(j,'$.species[0]') -> duck
json_value(j,'$.species')        -> NULL          (non-scalar -> NULL, as documented)
json_type(j,'n')                 -> UBIGINT
json_type(j,'species')           -> ARRAY
json_valid('{"a":1}') / ('{oops')-> true / false
json_array_length(j,'species')   -> 2
json_keys(j)                     -> [family, species, n]
json_structure(j)                -> {"family":"VARCHAR","species":["VARCHAR"],"n":"UBIGINT"}
to_json({'a':1,'b':[1,2]})       -> {"a":1,"b":[1,2]}
from_json('{"a":1}','{"a":"INTEGER"}') -> {a: 1},  typeof -> STRUCT(a INTEGER)
from_json_strict('{"a":"x"}','{"a":"INTEGER"}') -> Invalid Input Error: Failed to cast value to numerical: "x"
```

**Unnesting a JSON array [MEASURED]** — two idioms:

```sql
-- typed, one row per element
SELECT unnest(from_json(j->'species', '["VARCHAR"]')) FROM e;   -- -> duck / goose / swan

-- untyped traversal
SELECT * FROM json_each('{"a":1,"b":2}');
-- -> key|value|type|atom|id|parent|fullkey|path  e.g. a|1|UBIGINT|1|2|NULL|$.a|$
```

**Documented performance guidance [DOC]** — quoted, because it changes how we should generate multi-field extraction: "If multiple values need to be extracted from the same JSON, it is more efficient to extract a list of paths… The following will cause the JSON to be parsed twice… Resulting in a slower query that uses more memory:

```sql
SELECT json_extract(j, 'family') AS family, json_extract(j, 'species') AS species FROM example;
```

The following produces the same result but is faster and more memory-efficient:

```sql
WITH extracted AS (SELECT json_extract(j, ['family', 'species']) AS extracted_list FROM example)
SELECT extracted_list[1] AS family, extracted_list[2] AS species FROM extracted;
```
"

**[MEASURED]** the list form works and returns a LIST: `json_extract('{"a":1,"b":2}'::JSON, ['a','b'])` → `["1","2"]`. **Our generator should batch all path extractions on the same JSON column into one list call.** Note the doc's list result is indexed **1-based** in SQL (`extracted_list[1]`) even though JSON paths are 0-based. **[DOC]**

**[MEASURED] the JSON path may be a column** (unlike date formats): `json_extract_string(j, p)` with `p` from a CTE → `1`, `2`. Data-driven field access compiles to SQL.

**[MEASURED] undocumented on that page but present in the binary**: `json_merge_patch`, `json_pretty`, `json_quote`, `json_object`, `json_array`, `json_serialize_sql`, `json_deserialize_sql`, `json_serialize_plan`, `json_execute_serialized_sql`.

### D) No native equivalent

- **JSON Schema validation** — `json_valid` is *syntax only*; `json_structure` describes the shape but does not validate against a supplied schema. Structural validation must be assembled from `json_type`/`json_exists` checks, or stay a UDF.
- **jq-style expression language** — paths only; no filters, no transformations, no `select(...)`.
- **Wildcard / recursive descent in one call** (`$..key`, `$.a[*].b`) — **[UNCONFIRMED]**, see below. `json_tree` is the documented way to walk arbitrarily deep.
- **Key renaming / deep restructuring** — `json_merge_patch` handles RFC-7386-style merge, but arbitrary key mapping has nothing native.
- **Guaranteed key order preservation** — not documented either way.

---

## Summary: what can leave JavaScript

| Area | Verdict |
|---|---|
| Date/time parsing, formatting, truncation, parts | **Compile to SQL**, with one hard exception: per-row format strings. `try_strptime`/`strptime` also give us the null-vs-throw contract for free. |
| Time zones | **Compile to SQL**, but only with the offset idiom in A4(a), a pinned `SET TimeZone='UTC'`, and server-side rendering. Do not trust the driver's TIMESTAMPTZ output. |
| IP / CIDR | **Compile to SQL** for containment, network/broadcast/netmask, ordering, and validation. Range classification is a generatable `<<=` disjunction. MAC stays JS. |
| Geo | **Compile to SQL** for point-in-polygon, bbox, and radius — but `LOAD spatial` explicitly, mind the (lat, lon) axis order on the metric functions, and pair a constant bbox with the exact test to get the R-tree. Geohash stays JS. |
| JSON | **Compile to SQL**, with paths allowed per-row. Batch multi-field extraction into one list call. Schema validation stays JS. |

## Could not confirm

1. **What v2.0 changes.** No DuckDB 2.0 exists yet — `v1.5.5` is the newest release tag on `duckdb/duckdb` and `docs/current` is the 1.5 line. I found **no** primary v2.0 announcement, migration guide, or deprecation notice for any function in this report. The only forward-looking statements in the current docs are: the `GEOMETRY` binary format "is not yet stabilized and may change in a future release" **[DOC]**, and persisting custom CRS definitions is "something we are considering for the future" **[DOC]**. Treat any other "v2.0 will…" claim as unsourced.
2. **Why `icu` reads as already loaded** at connection open in `@duckdb/node-api` rather than on first use as documented. Measured, not explained — it may be driver-side eager loading. It does not change the conclusion (no `LOAD icu` needed), but the first-ever run on a cold extension directory still needs the download.
3. **The `timezone` part units doc discrepancy** is resolved empirically (seconds) but I did not file or find an upstream issue.
4. **JSONPath wildcard / recursive-descent support** (`$..key`, `$.a[*].b`) — not covered by the docs page I read and not probed.
5. **`ST_Distance_Sphere` axis order for non-POINT geometries** — the docs say "Only supports POINT geometries", so the (lat, lon) finding was only verified for points.
6. **Community extensions** (H3, geohash, etc.) — deliberately out of scope; only core/`spatial`/`inet`/`icu`/`json` were examined.
7. **Performance of any of this.** No benchmarks were run, per the brief. Every "faster/slower" statement here is a quote from DuckDB's own docs, not a measurement.
