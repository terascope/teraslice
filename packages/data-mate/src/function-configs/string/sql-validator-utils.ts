import { JS_WHITESPACE_CLASS } from './sql-regex-utils.js';
import { sqlLiteral } from '../sql-helpers.js';

/**
 * Predicate rules from `core-utils` and `validator`, rewritten as RE2 patterns.
 *
 * `isEmail` and `isMACAddress` in `core-utils` do not call `validator`; they use their own, simpler
 * patterns, which is what these reproduce.
*/
/**
 * `core-utils`' own `isEmail` pattern, which is not `validator.isEmail`.
 *
 * ```
 * const EmailRegex = /^[A-Z0-9._%+-@]{1,64}@(?:[A-Z0-9-]{1,63}\.){1,8}[A-Z]{2,63}$/i;
 * export function isEmail(input) { return isString(input) && EmailRegex.test(input); }
 * ```
 *
 * It has no lookaround or backreference, so RE2 compiles it.
 *
 * The `i` flag is expanded by hand rather than passed to DuckDB. Without the `u` flag JavaScript's
 * `i` uses simple case folding, while RE2 uses full Unicode folding, so `[A-Z]` with `i` matches
 * KELVIN SIGN and LATIN SMALL LETTER LONG S in RE2 but not in JavaScript. Writing `[A-Za-z]` avoids
 * case folding entirely, so no guard or UDF fallback is needed.
 *
 * `+-@` is a range (U+002B to U+0040), not three literals, so it also admits `,`, `.`, `/`, the
 * digits, `:`, `;`, `<`, `=`, `>` and `?`. It is copied as written, and RE2 reads the range the
 * same way.
*/
export const EMAIL_SQL_PATTERN = '^[A-Za-z0-9._%+-@]{1,64}@(?:[A-Za-z0-9-]{1,63}\\.){1,8}'
    + '[A-Za-z]{2,63}$';
/**
 * `core-utils`' `macAddressDelimiters`, which is not `validator.isMACAddress`.
 *
 * There is one fixed regex per delimiter, and `'any'` tries each in turn, so no backreference is
 * needed to keep the separators consistent. `space` uses `JS_WHITESPACE_CLASS` because its `\s` is
 * JavaScript's.
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
 * `validator.isMimeType`'s three regexes, with the `i` flag and `\s` expanded.
 *
 * They match a simple type from a fixed list of nine top-level types, `text/*` with an optional
 * charset, and `multipart/*` with up to two boundary or charset parameters. None of them use
 * lookaround or backreferences.
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
 * `validator.isISO31661Alpha2`'s 249 country codes, generated from its source.
 *
 * The function is a `Set` lookup on `str.toUpperCase()`. `core-utils` does not pass
 * `userAssignedCodes`, so nothing else in it is reachable.
 *
 * Non-ASCII values keep the UDF. JavaScript's `toUpperCase` uses full case mapping and can change a
 * string's length, so `'ﬁ'` (LATIN SMALL LIGATURE FI) uppercases to `'FI'`, a real country code,
 * where DuckDB's simple mapping leaves it unchanged.
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
