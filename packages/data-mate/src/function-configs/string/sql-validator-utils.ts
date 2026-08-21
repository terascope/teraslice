import { JS_WHITESPACE_CLASS } from './sql-regex-utils.js';
import { sqlLiteral } from '../sql-helpers.js';

/**
 * The predicate rules of `core-utils` and `validator`, transliterated.
 *
 * **Read the wrapper in `core-utils`, not the library it appears to call.** `isEmail` and
 * `isMACAddress` never reach `validator`, and both were written off as walls on the strength of
 * `validator`'s implementation - `isEmail` for being 173 procedural lines, `isMACAddress` for a
 * separator backreference RE2 cannot compile. The versions this codebase calls are one regex and
 * five fixed regexes. That is `docs/known-defects.md` DF9's lesson, four more times.
*/
/**
 * `core-utils`' own `isEmail`, transliterated - and it is NOT `validator.isEmail`.
 *
 * ```
 * const EmailRegex = /^[A-Z0-9._%+-@]{1,64}@(?:[A-Z0-9-]{1,63}\.){1,8}[A-Z]{2,63}$/i;
 * export function isEmail(input) { return isString(input) && EmailRegex.test(input); }
 * ```
 *
 * One regex, no lookaround, no backreference - RE2 compiles it. Its own comment says it is "not an
 * exhaustive email regex, which is impossible, but will catch obvious errors".
 *
 * **The `i` flag is expanded by hand rather than passed to DuckDB**, and that is the whole trick:
 * JavaScript's `i` outside unicode mode uses simple canonicalisation, while RE2's does full Unicode
 * case folding - so `[A-Z]` with `i` matches KELVIN SIGN and LATIN SMALL LETTER LONG S in RE2 and
 * not in JavaScript. Writing `[A-Za-z]` removes case folding from the picture entirely, so no guard
 * and no UDF fallback is needed.
 *
 * `+-@` is a RANGE (U+002B to U+0040), not three literals - it also admits `,`, `.`, `/`, the
 * digits, `:`, `;`, `<`, `=`, `>` and `?`. Copied as written; RE2 reads a class range the same way.
*/
export const EMAIL_SQL_PATTERN = '^[A-Za-z0-9._%+-@]{1,64}@(?:[A-Za-z0-9-]{1,63}\\.){1,8}'
    + '[A-Za-z]{2,63}$';
/**
 * `core-utils`' `macAddressDelimiters`, transliterated - and this is NOT `validator.isMACAddress`.
 *
 * The claim that this function is blocked on a backreference was about `validator`'s
 * implementation, which `core-utils` never calls. What it has is five FIXED regexes, one per
 * delimiter, and `'any'` is `Object.values(...).some(...)` - so there is no separator-consistency
 * problem to solve and nothing here needs a backreference.
 *
 * `space` is the one that needed care: its `\s` is JavaScript's, so it gets
 * `JS_WHITESPACE_CLASS` rather than RE2's narrower `\s`.
*/
export const MAC_SQL_PATTERNS: Record<string, string> = {
    colon: '^([0-9a-fA-F][0-9a-fA-F]:){5}([0-9a-fA-F][0-9a-fA-F])$',
    space: `^([0-9a-fA-F][0-9a-fA-F]${JS_WHITESPACE_CLASS}){5}([0-9a-fA-F][0-9a-fA-F])$`,
    dash: '^([0-9a-fA-F][0-9a-fA-F]-){5}([0-9a-fA-F][0-9a-fA-F])$',
    dot: '^([0-9a-fA-F]{4}\\.){2}([0-9a-fA-F]{4})$',
    none: '^([0-9a-fA-F]){12}$',
};
/** An OR of `regexp_matches` over several patterns - `isMACAddress`'s `any`, and `isMIMEType`. */
export function matchesAny(value: string, patterns: readonly string[]): string {
    return `(${patterns.map((p) => `regexp_matches(${value}, ${sqlLiteral(p)})`).join(' OR ')})`;
}

/**
 * `validator.isMimeType`'s three regexes, transliterated with the `i` flag and `\s` expanded.
 *
 * This one IS `validator`, and it is still only three patterns: a simple type from a fixed list of
 * nine top-level types, `text/*` with an optional charset, and `multipart/*` with up to two
 * boundary or charset parameters. No lookaround, no backreference, no locale table - which is what
 * separates it from `isURL` and `isPostalCode`.
*/
const MIME_CHARS = 'a-zA-Z0-9\\.\\-\\+';
const MIME_QUOTED = `("[${MIME_CHARS}${JS_WHITESPACE_CLASS.slice(1, -1)}]{0,70}"|[${MIME_CHARS}]{0,70})`;
const MIME_COMMENT = `(${JS_WHITESPACE_CLASS}?\\([${MIME_CHARS}${JS_WHITESPACE_CLASS.slice(1, -1)}]{1,20}\\))?`;
export const MIME_SQL_PATTERNS: readonly string[] = [
    '^(?i:application|audio|font|image|message|model|multipart|text|video)'
    + `/[${MIME_CHARS}_]{1,100}$`,
    `^(?i:text)/[${MIME_CHARS}]{1,100};${JS_WHITESPACE_CLASS}?`
    + `(?i:charset)=${MIME_QUOTED}${MIME_COMMENT}$`,
    `^(?i:multipart)/[${MIME_CHARS}]{1,100}(;${JS_WHITESPACE_CLASS}?`
    + `(?i:boundary|charset)=${MIME_QUOTED}${MIME_COMMENT}){0,2}$`,
];
/**
 * `validator.isISO31661Alpha2`'s country set, verbatim - 249 codes, generated from its own source.
 *
 * This is the whole function: a `Set` lookup on `str.toUpperCase()`. `core-utils` does not pass the
 * `userAssignedCodes` option, so nothing else in `validator`'s implementation is reachable. Calling
 * it a "locale table" put it in the same bucket as `isPostalCode`, and it is not in that bucket.
 *
 * The one guard it needs is ASCII: JavaScript's `toUpperCase` is FULL case mapping and can change
 * a string's LENGTH, so `'\ufb01'` (LATIN SMALL LIGATURE FI) uppercases to `'FI'` - a real country
 * code - where DuckDB's simple mapping leaves it alone. Non-ASCII therefore keeps the UDF.
*/
export const ISO_3166_ALPHA2: readonly string[] = [
    'AD',
    'AE',
    'AF',
    'AG',
    'AI',
    'AL',
    'AM',
    'AO',
    'AQ',
    'AR',
    'AS',
    'AT',
    'AU',
    'AW',
    'AX',
    'AZ',
    'BA',
    'BB',
    'BD',
    'BE',
    'BF',
    'BG',
    'BH',
    'BI',
    'BJ',
    'BL',
    'BM',
    'BN',
    'BO',
    'BQ',
    'BR',
    'BS',
    'BT',
    'BV',
    'BW',
    'BY',
    'BZ',
    'CA',
    'CC',
    'CD',
    'CF',
    'CG',
    'CH',
    'CI',
    'CK',
    'CL',
    'CM',
    'CN',
    'CO',
    'CR',
    'CU',
    'CV',
    'CW',
    'CX',
    'CY',
    'CZ',
    'DE',
    'DJ',
    'DK',
    'DM',
    'DO',
    'DZ',
    'EC',
    'EE',
    'EG',
    'EH',
    'ER',
    'ES',
    'ET',
    'FI',
    'FJ',
    'FK',
    'FM',
    'FO',
    'FR',
    'GA',
    'GB',
    'GD',
    'GE',
    'GF',
    'GG',
    'GH',
    'GI',
    'GL',
    'GM',
    'GN',
    'GP',
    'GQ',
    'GR',
    'GS',
    'GT',
    'GU',
    'GW',
    'GY',
    'HK',
    'HM',
    'HN',
    'HR',
    'HT',
    'HU',
    'ID',
    'IE',
    'IL',
    'IM',
    'IN',
    'IO',
    'IQ',
    'IR',
    'IS',
    'IT',
    'JE',
    'JM',
    'JO',
    'JP',
    'KE',
    'KG',
    'KH',
    'KI',
    'KM',
    'KN',
    'KP',
    'KR',
    'KW',
    'KY',
    'KZ',
    'LA',
    'LB',
    'LC',
    'LI',
    'LK',
    'LR',
    'LS',
    'LT',
    'LU',
    'LV',
    'LY',
    'MA',
    'MC',
    'MD',
    'ME',
    'MF',
    'MG',
    'MH',
    'MK',
    'ML',
    'MM',
    'MN',
    'MO',
    'MP',
    'MQ',
    'MR',
    'MS',
    'MT',
    'MU',
    'MV',
    'MW',
    'MX',
    'MY',
    'MZ',
    'NA',
    'NC',
    'NE',
    'NF',
    'NG',
    'NI',
    'NL',
    'NO',
    'NP',
    'NR',
    'NU',
    'NZ',
    'OM',
    'PA',
    'PE',
    'PF',
    'PG',
    'PH',
    'PK',
    'PL',
    'PM',
    'PN',
    'PR',
    'PS',
    'PT',
    'PW',
    'PY',
    'QA',
    'RE',
    'RO',
    'RS',
    'RU',
    'RW',
    'SA',
    'SB',
    'SC',
    'SD',
    'SE',
    'SG',
    'SH',
    'SI',
    'SJ',
    'SK',
    'SL',
    'SM',
    'SN',
    'SO',
    'SR',
    'SS',
    'ST',
    'SV',
    'SX',
    'SY',
    'SZ',
    'TC',
    'TD',
    'TF',
    'TG',
    'TH',
    'TJ',
    'TK',
    'TL',
    'TM',
    'TN',
    'TO',
    'TR',
    'TT',
    'TV',
    'TW',
    'TZ',
    'UA',
    'UG',
    'UM',
    'US',
    'UY',
    'UZ',
    'VA',
    'VC',
    'VE',
    'VG',
    'VI',
    'VN',
    'VU',
    'WF',
    'WS',
    'YE',
    'YT',
    'ZA',
    'ZM',
    'ZW',
];
