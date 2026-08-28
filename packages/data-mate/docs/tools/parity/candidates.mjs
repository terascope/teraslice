// DuckDB expression candidates for data-mate's function catalogue.
//
// Rules followed here:
//  - `v` is the staged VARCHAR column holding the input value.
//  - For FIELD_VALIDATION functions supply the PREDICATE only. data-mate validators return
//    the value or null (validatorTransformFN), so the harness wraps predicates as
//    `CASE WHEN <pred> THEN v ELSE NULL END`. Do not write the CASE yourself.
//  - `sql: null` means no single-expression equivalent was FOUND BY INSPECTION. A blank is better
//    than a guess; an unverified mapping in the chart is worse than an admitted gap.
//
//    **But do not read a blank as a proof of impossibility - 41 of the 53 blanks here turned out to
//    be wrong.** Measured 2026-08-21, after the emissions were built and gated. Several notes
//    described a DIFFERENT IMPLEMENTATION than the one `core-utils` actually calls: the five marked
//    CORRECTED below. Before adding a blank, open the function in `core-utils`/`ip-utils` and read
//    every branch - see `docs/sql-emission.md` "How to add one".
//  - `args` are the arguments used when exercising the function, and are interpolated
//    into `sql` by the harness via ${...} when `sql` is a function.
//  - `battery` names the input set (see lib/battery.mjs). Defaults by category.

const S = (sql, note, extra = {}) => ({ sql, note, ...extra });
const NONE = (note, extra = {}) => ({ sql: null, note, ...extra });

// ---------------------------------------------------------------- BOOLEAN (3)
export const BOOLEAN_FNS = {
    isBoolean: S(`lower(v) IN ('true','false')`,
        'true only for actual booleans', { battery: 'booleans' }),
    isBooleanLike: S(`lower(v) IN ('true','false','yes','no','1','0','')`,
        'accepts truthy/falsy strings and empty', { battery: 'booleans' }),
    toBoolean: S(`CASE WHEN lower(v) IN ('true','yes','1') THEN true
                       WHEN lower(v) IN ('false','no','0','') THEN false END`,
        'permissive coercion; empty string is false, unknown strings throw', { battery: 'booleans' }),
};

// ---------------------------------------------------------------- OBJECT (3)
export const OBJECT_FNS = {
    equals: NONE('deep equality against an arbitrary arg value; shape-dependent'),
    isEmpty: S(`(v IS NULL OR v = '')`,
        'true for nil/empty; ignoreWhitespace arg trims first', { battery: 'strings' }),
    lookup: NONE('table/map lookup against a user-supplied dictionary arg'),
};

// ---------------------------------------------------------------- JSON (4)
export const JSON_FNS = {
    cast: NONE('re-types a field without changing the value; a metadata operation, not an expression'),
    parseJSON: S(`json(v)`, 'parses a JSON string into a value', { battery: 'strings' }),
    setDefault: NONE('substitutes a default when the value is nil; needs the target field config'),
    toJSON: S(`to_json(v)`, 'serializes a value to a JSON string', { battery: 'strings' }),
};

// ---------------------------------------------------------------- NUMERIC (53)
const N = 'TRY_CAST(v AS DOUBLE)';
export const NUMERIC_FNS = {
    abs: S(`abs(${N})`, 'absolute value'),
    acos: S(`acos(${N})`, 'arccosine, radians'),
    acosh: S(`acosh(${N})`, 'inverse hyperbolic cosine'),
    asin: S(`asin(${N})`, 'arcsine, radians'),
    asinh: S(`asinh(${N})`, 'inverse hyperbolic sine'),
    atan: S(`atan(${N})`, 'arctangent, radians'),
    atan2: S(`atan2(${N}, 2)`, 'two-argument arctangent', { args: { value: 2 } }),
    atanh: S(`atanh(${N})`, 'inverse hyperbolic tangent'),
    cbrt: S(`cbrt(${N})`, 'cube root'),
    ceil: S(`ceil(${N})`, 'round up'),
    clz32: NONE('count leading zeros in a 32-bit int; no direct SQL function'),
    cos: S(`cos(${N})`, 'cosine'),
    cosh: S(`cosh(${N})`, 'hyperbolic cosine'),
    exp: S(`exp(${N})`, 'e^x'),
    expm1: S(`exp(${N}) - 1`, 'e^x - 1, precision-preserving in JS'),
    floor: S(`floor(${N})`, 'round down'),
    fround: S(`TRY_CAST(TRY_CAST(v AS FLOAT) AS DOUBLE)`, 'round to nearest float32'),
    hypot: S(`sqrt(pow(${N},2) + pow(2,2))`, 'sqrt of sum of squares', { args: { value: 2 } }),
    log: S(`ln(${N})`, 'natural log'),
    log1p: S(`ln(1 + ${N})`, 'ln(1+x)'),
    log2: S(`log2(${N})`, 'base-2 log'),
    log10: S(`log10(${N})`, 'base-10 log'),
    pow: S(`pow(${N}, 2)`, 'x raised to a power', { args: { value: 2 } }),
    random: NONE('non-deterministic; excluded from parity by definition'),
    round: S(`round(${N})`, 'round to nearest integer'),
    setPrecision: S(`round(${N}, 2)`, 'round to N decimal places', { args: { digits: 2 } }),
    sign: S(`sign(${N})`, '-1, 0 or 1'),
    sin: S(`sin(${N})`, 'sine'),
    sinh: S(`sinh(${N})`, 'hyperbolic sine'),
    sqrt: S(`sqrt(${N})`, 'square root'),
    tan: S(`tan(${N})`, 'tangent'),
    tanh: S(`tanh(${N})`, 'hyperbolic tangent'),
    toCelsius: S(`round((${N} - 32) * 5.0/9.0, 2)`, 'fahrenheit to celsius; data-mate rounds to 2dp'),
    toFahrenheit: S(`round((${N} * 9.0/5.0) + 32, 2)`, 'celsius to fahrenheit; data-mate rounds to 2dp'),
    toNumber: S(`${N}`, 'coerce to number'),
    add: S(`${N} + 5`, 'add a scalar', { args: { value: 5 } }),
    subtract: S(`${N} - 5`, 'subtract a scalar', { args: { value: 5 } }),
    multiply: S(`${N} * 3`, 'multiply by a scalar', { args: { value: 3 } }),
    divide: S(`${N} / 2`, 'divide by a scalar', { args: { value: 2 } }),
    modulus: S(`${N} % 3`, 'remainder', { args: { value: 3 } }),
    isEven: S(`(${N} % 2) = 0`, 'even test'),
    isOdd: S(`abs(${N} % 2) = 1`, 'odd test'),
    isGreaterThan: S(`${N} > 5`, 'strict greater-than', { args: { value: 5 } }),
    isGreaterThanOrEqualTo: S(`${N} >= 5`, 'greater or equal', { args: { value: 5 } }),
    isLessThan: S(`${N} < 5`, 'strict less-than', { args: { value: 5 } }),
    isLessThanOrEqualTo: S(`${N} <= 5`, 'less or equal', { args: { value: 5 } }),
    inNumberRange: S(`${N} > 0 AND ${N} < 100`,
        'range test; min/max exclusive unless inclusive arg set', { args: { min: 0, max: 100 } }),
    // The *Values family reduces an ARRAY field rather than a scalar.
    addValues: S(`list_sum(v::DOUBLE[])`, 'sum of an array field', { arrayInput: true }),
    subtractValues: NONE('left-fold subtraction over an array; list_reduce exists but ordering semantics unverified', { arrayInput: true }),
    multiplyValues: NONE('left-fold product over an array; no list_product in this build', { arrayInput: true }),
    divideValues: NONE('left-fold division over an array; ordering semantics unverified', { arrayInput: true }),
    maxValues: S(`list_max(v::DOUBLE[])`, 'max of an array field', { arrayInput: true }),
    minValues: S(`list_min(v::DOUBLE[])`, 'min of an array field', { arrayInput: true }),
};

// ---------------------------------------------------------------- STRING (50)
export const STRING_FNS = {
    toUpperCase: S(`upper(v)`, 'uppercase; JS does full case-folding (ß→SS), SQL does not'),
    toLowerCase: S(`lower(v)`, 'lowercase; differs on Turkish dotted I'),
    trim: S(`trim(v)`, 'trim both ends; optional char arg'),
    trimStart: S(`ltrim(v)`, 'trim leading'),
    trimEnd: S(`rtrim(v)`, 'trim trailing'),
    reverse: S(`reverse(v)`,
        'reverse; data-mate reverses UTF-16 code units and corrupts astral characters (defect D3)'),
    truncate: S(`left(v, 4)`, 'first N characters', { args: { size: 4 } }),
    contains: S(`contains(v, 'a')`, 'substring test', { args: { value: 'a' } }),
    startsWith: S(`starts_with(v, 'a')`, 'prefix test', { args: { value: 'a' } }),
    endsWith: S(`ends_with(v, 'c')`, 'suffix test', { args: { value: 'c' } }),
    split: S(`string_split(v, ',')`, 'split into an array', { args: { delimiter: ',' } }),
    join: NONE('joins an ARRAY field into a string; array-input, covered by array_to_string', { arrayInput: true }),
    encodeBase64: S(`to_base64(v::BLOB)`, 'base64 encode'),
    decodeBase64: S(`from_base64(v)::VARCHAR`, 'base64 decode'),
    encodeHex: S(`lower(hex(v))`, 'hex encode'),
    decodeHex: S(`unhex(v)::VARCHAR`, 'hex decode'),
    encodeURL: S(`url_encode(v)`, 'percent-encode'),
    decodeURL: S(`url_decode(v)`, 'percent-decode'),
    encodeSHA: S(`sha256(v)`, 'SHA-256 hex digest (default 256)'),
    encodeSHA1: S(`sha1(v)`, 'SHA-1 hex digest'),
    encode: NONE('dispatches to an encoding named by an arg; a router, not one expression'),
    replaceLiteral: S(`replace(v, 'a', 'X')`, 'literal substring replace',
        { args: { search: 'a', replace: 'X' } }),
    replaceRegex: S(`regexp_replace(v, '[0-9]', 'X', 'g')`, 'regex replace; RE2 only',
        { args: { regex: '[0-9]', replace: 'X', global: true } }),
    extract: S(`regexp_extract(v, '([a-z]+)', 1)`, 'regex or start/end extraction',
        { args: { regex: '([a-z]+)' } }),
    isLength: S(`length(v) BETWEEN 2 AND 6`, 'length range test', { args: { min: 2, max: 6 } }),
    isString: S(`v IS NOT NULL`, 'type test; every staged value is already VARCHAR so this is vacuous here'),
    isAlpha: S(`regexp_full_match(v, '[a-zA-Z]+')`, 'letters only; locale arg unsupported in SQL'),
    isAlphaNumeric: S(`regexp_full_match(v, '[a-zA-Z0-9]+')`, 'letters and digits only'),
    isBase64: S(`regexp_full_match(v, '[A-Za-z0-9+/]*={0,2}') AND length(v) % 4 = 0 AND length(v) > 0`,
        'approximation; validator lib is stricter'),
    isUUID: S(`TRY_CAST(v AS UUID) IS NOT NULL`, 'UUID test'),
    isPort: S(`TRY_CAST(v AS INTEGER) BETWEEN 1 AND 65535`, 'valid TCP/UDP port'),
    isEmail: S(`regexp_full_match(v, '[^@\\s]+@[^@\\s]+\\.[^@\\s]+')`,
        'APPROXIMATION - the validator library is stricter (rejects a@b..com, accepts quoted locals)',
        { approx: true, battery: 'emails' }),
    isFQDN: S(`regexp_full_match(v, '([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\\.)+[a-zA-Z]{2,}')`,
        'APPROXIMATION of validator.isFQDN', { approx: true }),
    isURL: S(`regexp_full_match(v, 'https?://[^\\s]+')`,
        'APPROXIMATION of validator.isURL', { approx: true }),
    isHash: NONE('length+charset per named algorithm arg; a router over ~15 variants'),
    isMACAddress: S(`regexp_full_match(v, '([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}')`,
        'APPROXIMATION; data-mate supports several delimiter styles', { approx: true }),
    // CORRECTED 2026-08-21: `validator.isMimeType` is THREE regexes, and its own source comment
    // says it deliberately does NOT check IANA's table "because of lightness purposes".
    isMIMEType: S(`regexp_full_match(v, '<see string/sql-validator-utils.ts MIME_SQL_PATTERNS>')`,
        'three regexes: a fixed 9-entry type list, text/* with charset, multipart/* with params'),
    // CORRECTED 2026-08-21: a table lookup is exactly what SQL does well - one 249-entry IN list.
    isCountryCode: S(`upper(v) IN (<the 249 ISO-3166 alpha-2 codes>)`,
        'one Set lookup on toUpperCase; needs an ASCII guard because full case mapping can change length'),
    isPostalCode: NONE('per-locale postal patterns from the validator library'),
    isISDN: NONE('phone-number parsing via awesome-phonenumber'),
    // CORRECTED 2026-08-21: this note described the WRONG FUNCTION. `isPhoneNumberLike` never
    // touches awesome-phonenumber - it only shares a file with `isISDN`/`toISDN`, which do.
    isPhoneNumberLike: S(`length(regexp_replace(v, '[^0-9]', '', 'g')) BETWEEN 7 AND 20`,
        'strips non-digits and counts them; no phone-number parsing anywhere in it'),
    toISDN: NONE('phone-number normalization via awesome-phonenumber'),
    // CORRECTED 2026-08-21: there IS a scalar form - string_split + list_filter + list_reduce,
    // measured EXACT against shannonEntropy. Astral input needs a guard, the formula does not.
    entropy: S(`<see string/sql-utils.ts shannonEntropySql>`,
        'per-character aggregation via list_filter over the distinct characters, then a fold'),
    // CORRECTED 2026-08-21: it is FULL_VALUES over ONE field's value, not a row-context function.
    // On a scalar string column it is md5/sha1/sha256 directly.
    createID: S(`md5(v)`, 'hashes toString(value) of a single field; scalar string columns only'),
    toCamelCase: NONE('word-splitting plus diacritic folding; regex approximation would drift'),
    toPascalCase: NONE('as toCamelCase'),
    toKebabCase: NONE('as toCamelCase'),
    toTitleCase: NONE('as toCamelCase'),
    toSnakeCase: NONE('data-mate also strips diacritics (ünïcödé→unicode); regex alone drifts'),
    toString: S(`v::VARCHAR`, 'stringify'),
};

// ---------------------------------------------------------------- DATE (56)
// data-mate stores a DateTuple and serializes ISO8601 with milliseconds + 'Z'.
// Any transform returning a date must be rendered the same way to be comparable.
const D = `TRY_CAST(v AS TIMESTAMPTZ)`;
const ISO = (x) => `CASE WHEN ${x} IS NULL THEN NULL ELSE strftime(${x},'%Y-%m-%dT%H:%M:%S.%g') || 'Z' END`;

export const DATE_FNS = {
    // --- extraction (return numbers) ---
    getYear: S(`date_part('year', ${D})`, 'local year; identical to UTC when TimeZone=UTC'),
    getUTCYear: S(`date_part('year', ${D} AT TIME ZONE 'UTC')`, 'UTC year'),
    getMonth: S(`date_part('month', ${D})`, 'month 1-12'),
    getUTCMonth: S(`date_part('month', ${D} AT TIME ZONE 'UTC')`, 'UTC month'),
    getDate: S(`date_part('day', ${D})`, 'day of month'),
    getUTCDate: S(`date_part('day', ${D} AT TIME ZONE 'UTC')`, 'UTC day of month'),
    getHours: S(`date_part('hour', ${D})`, 'hour 0-23'),
    getUTCHours: S(`date_part('hour', ${D} AT TIME ZONE 'UTC')`, 'UTC hour'),
    getMinutes: S(`date_part('minute', ${D})`, 'minute'),
    getUTCMinutes: S(`date_part('minute', ${D} AT TIME ZONE 'UTC')`, 'UTC minute'),
    getSeconds: S(`date_part('second', ${D})`, 'second'),
    getMilliseconds: S(`date_part('millisecond', ${D}) % 1000`, 'millisecond component'),

    // --- truncation ---
    toDailyDate: S(ISO(`date_trunc('day', ${D})`), 'truncate to day'),
    toHourlyDate: S(ISO(`date_trunc('hour', ${D})`), 'truncate to hour'),
    toMonthlyDate: S(ISO(`date_trunc('month', ${D})`), 'truncate to month'),
    toYearlyDate: S(ISO(`date_trunc('year', ${D})`), 'truncate to year'),

    // --- arithmetic ---
    addToDate: S(ISO(`${D} + INTERVAL 3 DAY`), 'add an interval', { args: { days: 3 } }),
    subtractFromDate: S(ISO(`${D} - INTERVAL 2 MONTH`), 'subtract an interval', { args: { months: 2 } }),
    getTimeBetween: S(`date_diff('minute', ${D}, '2024-03-11T00:00:00Z'::TIMESTAMPTZ)`,
        'difference in a named unit', { args: { end: '2024-03-11T00:00:00Z', interval: 'minutes' } }),

    // --- setters ---
    setYear: S(ISO(`make_timestamptz(2030, date_part('month',${D})::BIGINT, date_part('day',${D})::BIGINT,
        date_part('hour',${D})::BIGINT, date_part('minute',${D})::BIGINT, date_part('second',${D}))`),
    'replace the year', { args: { value: 2030 } }),
    setMonth: NONE('replace month; make_timestamptz composition is expressible but day-overflow semantics differ'),
    setDate: NONE('replace day-of-month; overflow semantics differ from JS Date'),
    setHours: NONE('replace hour; composition works but rollover semantics unverified'),
    setMinutes: NONE('as setHours'),
    setSeconds: NONE('as setHours'),
    setMilliseconds: NONE('as setHours'),

    // --- formatting / parsing ---
    formatDate: S(`strftime(${D}, '%Y/%m/%d')`, 'format via a strftime-style pattern',
        { args: { format: 'yyyy/MM/dd' }, approx: true }),
    toDate: S(ISO(`try_strptime(v, '%Y-%m-%d')`), 'parse with an explicit format',
        { args: { format: 'yyyy-MM-dd' }, approx: true }),

    // --- timezone ---
    setTimezone: NONE('attaches a fixed offset to the stored DateTuple; data-mate keeps the offset, TIMESTAMPTZ normalizes to UTC'),
    toTimeZone: S(ISO(`timezone('America/Denver', ${D})`), 'convert to a named zone',
        { args: { timezone: 'America/Denver' }, approx: true }),
    getTimezoneOffset: S(`date_part('timezone', ${D}) / 60`, 'offset in minutes',
        { args: { timezone: 'America/Denver' }, approx: true }),
    timezoneToOffset: NONE('maps a zone name to an offset without a date; needs a reference instant'),
    lookupTimezone: NONE('lat/lon to timezone name; requires a timezone geo database DuckDB does not ship'),
    toTimeZoneUsingLocation: NONE('as lookupTimezone'),

    // --- validators: structural ---
    isISO8601: S(`${D} IS NOT NULL`, 'parses as ISO8601'),
    isDate: S(`${D} IS NOT NULL`, 'parses as a date, optionally against a format'),
    isEpoch: S(`TRY_CAST(v AS BIGINT) IS NOT NULL AND TRY_CAST(v AS BIGINT) BETWEEN 0 AND 9999999999`,
        'looks like epoch seconds', { approx: true }),
    isEpochMillis: S(`TRY_CAST(v AS BIGINT) IS NOT NULL AND TRY_CAST(v AS BIGINT) > 9999999999`,
        'looks like epoch milliseconds', { approx: true }),
    isLeapYear: S(`(date_part('year',${D}) % 4 = 0 AND date_part('year',${D}) % 100 <> 0)
                   OR date_part('year',${D}) % 400 = 0`, 'gregorian leap year'),

    // --- validators: comparison ---
    isAfter: S(`${D} > '2024-01-01T00:00:00Z'::TIMESTAMPTZ`, 'after a given date',
        { args: { date: '2024-01-01T00:00:00Z' } }),
    isBefore: S(`${D} < '2024-12-31T00:00:00Z'::TIMESTAMPTZ`, 'before a given date',
        { args: { date: '2024-12-31T00:00:00Z' } }),
    isBetween: S(`${D} BETWEEN '2024-01-01T00:00:00Z'::TIMESTAMPTZ AND '2024-12-31T00:00:00Z'::TIMESTAMPTZ`,
        'within a range', { args: { start: '2024-01-01T00:00:00Z', end: '2024-12-31T00:00:00Z' } }),

    // --- validators: day of week (dayofweek: 0=Sunday) ---
    isSunday: S(`dayofweek(${D}) = 0`, 'is a Sunday'),
    isMonday: S(`dayofweek(${D}) = 1`, 'is a Monday'),
    isTuesday: S(`dayofweek(${D}) = 2`, 'is a Tuesday'),
    isWednesday: S(`dayofweek(${D}) = 3`, 'is a Wednesday'),
    isThursday: S(`dayofweek(${D}) = 4`, 'is a Thursday'),
    isFriday: S(`dayofweek(${D}) = 5`, 'is a Friday'),
    isSaturday: S(`dayofweek(${D}) = 6`, 'is a Saturday'),
    isWeekday: S(`dayofweek(${D}) BETWEEN 1 AND 5`, 'Monday to Friday'),
    isWeekend: S(`dayofweek(${D}) IN (0,6)`, 'Saturday or Sunday'),

    // --- validators: relative to now (non-deterministic) ---
    isToday: NONE('relative to current date; excluded from parity as non-deterministic'),
    isTomorrow: NONE('relative to current date; non-deterministic'),
    isYesterday: NONE('relative to current date; non-deterministic'),
    isFuture: NONE('relative to now; non-deterministic'),
    isPast: NONE('relative to now; non-deterministic'),
};

// ---------------------------------------------------------------- IP (21)
const I = `TRY_CAST(v AS INET)`;
const PLAIN = `position('/' in v) = 0`;
export const IP_FNS = {
    isIP: S(`${I} IS NOT NULL AND ${PLAIN}`, 'a bare IPv4 or IPv6 address', { battery: 'ips' }),
    isIPv4: S(`${I} IS NOT NULL AND family(${I}) = 4 AND ${PLAIN}`, 'IPv4 only', { battery: 'ips' }),
    isIPv6: S(`${I} IS NOT NULL AND family(${I}) = 6 AND ${PLAIN}`, 'IPv6 only', { battery: 'ips' }),
    isCIDR: S(`${I} IS NOT NULL AND position('/' in v) > 0`, 'a CIDR range', { battery: 'ips' }),
    inIPRange: S(`${I} <<= '10.0.0.0/8'::INET`, 'membership in a CIDR',
        { args: { cidr: '10.0.0.0/8' }, battery: 'ips' }),
    getCIDRNetwork: S(`network(${I})::VARCHAR`, 'network address of a CIDR', { battery: 'cidrs' }),
    getCIDRBroadcast: S(`broadcast(${I})::VARCHAR`, 'broadcast address of a CIDR', { battery: 'cidrs' }),
    getCIDRMin: S(`network(${I})::VARCHAR`, 'first address in a CIDR', { battery: 'cidrs', approx: true }),
    getCIDRMax: S(`broadcast(${I})::VARCHAR`, 'last address in a CIDR', { battery: 'cidrs', approx: true }),
    getFirstIPInCIDR: S(`network(${I})::VARCHAR`, 'first address', { battery: 'cidrs', approx: true }),
    getLastIPInCIDR: S(`broadcast(${I})::VARCHAR`, 'last address', { battery: 'cidrs', approx: true }),
    getFirstUsableIPInCIDR: NONE('first usable excludes the network address; arithmetic on INET unverified', { battery: 'cidrs' }),
    getLastUsableIPInCIDR: NONE('last usable excludes broadcast; arithmetic on INET unverified', { battery: 'ips' }),
    toCIDR: NONE('builds a CIDR from an address plus a suffix arg', { battery: 'ips' }),
    isRoutableIP: NONE('checks against the reserved/private block tables', { battery: 'ips' }),
    isNonRoutableIP: NONE('inverse of isRoutableIP', { battery: 'ips' }),
    isMappedIPv4: S(`${I} IS NOT NULL AND family(${I}) = 6 AND v LIKE '::ffff:%'`,
        'IPv4-mapped IPv6 address', { battery: 'ips', approx: true }),
    extractMappedIPv4: NONE('extracts the embedded v4 from a mapped v6 address', { battery: 'ips' }),
    reverseIP: NONE('reverses octet/hextet order as a string', { battery: 'ips' }),
    ipToInt: NONE('data-mate returns an unbounded bigint; INET has no direct numeric cast in this build', { battery: 'ips' }),
    intToIP: NONE('inverse of ipToInt', { battery: 'ips' }),
};

// ---------------------------------------------------------------- GEO (15)
// GeoJSON input is staged as a JSON string, so ST_GeomFromGeoJSON(v) is the entry point.
const G = `ST_GeomFromGeoJSON(v)`;
export const GEO_FNS = {
    isGeoJSON: S(`TRY_CAST(v AS JSON) IS NOT NULL AND json_extract_string(v,'$.type') IS NOT NULL`,
        'parses as GeoJSON', { battery: 'geojson', approx: true }),
    isGeoPoint: NONE('accepts strings, [lon,lat] tuples and {lat,lon} objects; multi-shape, not one expression',
        { battery: 'geopoints' }),
    isGeoShapePoint: S(`ST_GeometryType(${G})::VARCHAR = 'POINT'`, 'GeoJSON Point', { battery: 'geojson' }),
    isGeoShapePolygon: S(`ST_GeometryType(${G})::VARCHAR = 'POLYGON'`, 'GeoJSON Polygon', { battery: 'geojson' }),
    isGeoShapeMultiPolygon: S(`ST_GeometryType(${G})::VARCHAR = 'MULTIPOLYGON'`,
        'GeoJSON MultiPolygon', { battery: 'geojson' }),
    geoContains: S(`ST_Contains(${G}, ST_Point(1, 2))`, 'geometry contains the arg',
        { battery: 'geojson', args: { value: '2,1' } }),
    geoContainsPoint: S(`ST_Contains(${G}, ST_Point(1, 2))`, 'geometry contains a point',
        { battery: 'geojson', args: { point: '2,1' } }),
    geoWithin: S(`ST_Within(${G}, ST_MakeEnvelope(-180,-90,180,90))`, 'geometry within the arg',
        { battery: 'geojson', args: { value: '-90,-180|90,180' } }),
    geoIntersects: S(`ST_Intersects(${G}, ST_MakeEnvelope(-180,-90,180,90))`, 'geometries intersect',
        { battery: 'geojson', args: { value: '-90,-180|90,180' } }),
    geoDisjoint: S(`ST_Disjoint(${G}, ST_MakeEnvelope(-180,-90,180,90))`, 'geometries do not intersect',
        { battery: 'geojson', args: { value: '-90,-180|90,180' } }),
    geoPointWithinRange: S(`ST_DWithin_Spheroid(${G}, ST_Point(-105, 40), 5000)`,
        'within a distance of a point', { battery: 'geojson', args: { point: '40,-105', distance: '5km' }, approx: true }),
    inGeoBoundingBox: S(`ST_Within(${G}, ST_MakeEnvelope(-180,-90,180,90))`,
        'inside a bounding box', { battery: 'geojson', args: { top_left: '90,-180', bottom_right: '-90,180' } }),
    geoRelation: NONE('dispatches on a relation-name arg; ST_Relate is absent from this build, though the individual predicates exist',
        { battery: 'geojson' }),
    toGeoJSON: NONE('accepts points/boundaries and emits GeoJSON; multi-shape input', { battery: 'geopoints' }),
    toGeoPoint: NONE('parses several point encodings into {lat,lon}', { battery: 'geopoints' }),
};

export const ALL = {
    ...BOOLEAN_FNS, ...OBJECT_FNS, ...JSON_FNS, ...NUMERIC_FNS,
    ...STRING_FNS, ...DATE_FNS, ...IP_FNS, ...GEO_FNS,
};
