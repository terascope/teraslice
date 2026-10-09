import { isAsciiSql, sqlLiteral } from '../sql-helpers.js';

/**
 * `validator.isPostalCode` as SQL, for an ASCII string.
 *
 * **The patterns are validator 13's `isPostalCode` table, copied** - validator does not export it,
 * only `locales`. `postal-codes-spec`'s guard fails if validator adds or removes a locale, and
 * the emission gate compares every locale with the UDF over a battery, so a changed pattern shows
 * up as a failing case rather than a silent difference.
 *
 * Three rewrites make them RE2 patterns that match exactly what JavaScript matches:
 *
 * - **Non-ASCII input goes to the UDF.** JavaScript's `\s` matches 25 code points, RE2's 5; inside
 *   ASCII they differ only on U+000B, so `\s` is written out as `[\t\n\x0B\f\r ]`.
 * - **Lookahead and backreferences become a second pattern that must NOT match** - RE2 has neither.
 *   Each was worked through by hand, backtracking included (see the four entries below).
 * - `i` is passed as the regex option. Case folding agrees in ASCII.
*/

/** JavaScript's `\s`, restricted to ASCII. */
const SPACE = '[\\t\\n\\x0B\\f\\r ]';

interface PostalPattern {
    /** An anchored RE2 pattern. */
    readonly match: string;
    /** Anchored patterns that must NOT match - a JavaScript lookahead, rewritten. */
    readonly exclude?: readonly string[];
    readonly insensitive?: boolean;
}

const threeDigit = { match: '^\\d{3}$' };
const fourDigit = { match: '^\\d{4}$' };
const fiveDigit = { match: '^\\d{5}$' };
const sixDigit = { match: '^\\d{6}$' };

export const POSTAL_PATTERNS: Readonly<Record<string, PostalPattern>> = {
    AD: { match: '^AD\\d{3}$' },
    AT: fourDigit,
    AU: fourDigit,
    AZ: { match: '^AZ\\d{4}$' },
    BA: { match: '^([7-8]\\d{4}$)' },
    BD: { match: '^([1-8][0-9]{3}|9[0-4][0-9]{2})$' },
    BE: fourDigit,
    BG: fourDigit,
    BR: { match: '^\\d{5}-?\\d{3}$' },
    BY: { match: '^2[1-4]\\d{4}$' },
    CA: {
        match: `^[ABCEGHJKLMNPRSTVXY]\\d[ABCEGHJ-NPRSTV-Z][\\t\\n\\x0B\\f\\r \\-]?\\d[ABCEGHJ-NPRSTV-Z]\\d$`,
        insensitive: true,
    },
    CH: fourDigit,
    CN: { match: '^(0[1-7]|1[012356]|2[0-7]|3[0-6]|4[0-7]|5[1-7]|6[1-7]|7[1-5]|8[1345]|9[09])\\d{4}$' },
    CO: {
        match: '^(05|08|11|13|15|17|18|19|20|23|25|27|41|44|47|50|52|54|63|66|68|70|73|76|81|85|86|88'
            + '|91|94|95|97|99)(\\d{4})$',
    },
    CZ: { match: `^\\d{3}${SPACE}?\\d{2}$` },
    DE: fiveDigit,
    DK: fourDigit,
    DO: fiveDigit,
    DZ: fiveDigit,
    EE: fiveDigit,
    ES: { match: '^(5[0-2]{1}|[0-4]{1}\\d{1})\\d{3}$' },
    FI: fiveDigit,
    FR: { match: '^(?:(?:0[1-9]|[1-8]\\d|9[0-5])\\d{3}|97[1-46]\\d{2})$' },
    GB: { match: `^(gir${SPACE}?0aa|[a-z]{1,2}\\d[\\da-z]?${SPACE}?(\\d[a-z]{2})?)$`, insensitive: true },
    GR: { match: `^\\d{3}${SPACE}?\\d{2}$` },
    HR: { match: '^([1-5]\\d{4}$)' },
    HT: { match: '^HT\\d{4}$' },
    HU: fourDigit,
    ID: fiveDigit,
    // `/^(?!.*(?:o))[A-Za-z]\d[\dw]\s\w{4}$/i` - the lookahead's `.` stops at a line terminator
    IE: {
        match: `^[A-Za-z]\\d[\\dw]${SPACE}\\w{4}$`,
        exclude: ['^[^\\n\\r]*o'],
        insensitive: true,
    },
    IL: { match: '^(\\d{5}|\\d{7})$' },
    // `/^((?!10|29|35|54|55|65|66|86|87|88|89)[1-9][0-9]{5})$/`
    IN: {
        match: '^[1-9][0-9]{5}$',
        exclude: ['^(10|29|35|54|55|65|66|86|87|88|89)'],
    },
    // `/^(?!(\d)\1{3})[13-9]{4}[1346-9][013-9]{5}$/` - "not four of the same digit"
    IR: {
        match: '^[13-9]{4}[1346-9][013-9]{5}$',
        exclude: ['^(0000|1111|2222|3333|4444|5555|6666|7777|8888|9999)'],
    },
    IS: threeDigit,
    IT: fiveDigit,
    JP: { match: '^\\d{3}\\-\\d{4}$' },
    KE: fiveDigit,
    KR: { match: '^(\\d{5}|\\d{6})$' },
    LI: { match: '^(948[5-9]|949[0-7])$' },
    LT: { match: '^LT\\-\\d{5}$' },
    LU: fourDigit,
    LV: { match: '^LV\\-\\d{4}$' },
    LK: fiveDigit,
    MC: { match: '^980\\d{2}$' },
    MG: threeDigit,
    MX: fiveDigit,
    MT: { match: `^[A-Za-z]{3}${SPACE}{0,1}\\d{4}$` },
    MY: fiveDigit,
    // `/^[1-9]\d{3}\s?(?!sa|sd|ss)[a-z]{2}$/i` - whichever way `\s?` backtracks, the lookahead
    // lands on the last two characters, so it excludes exactly those endings
    NL: {
        match: `^[1-9]\\d{3}${SPACE}?[a-z]{2}$`,
        exclude: ['(sa|sd|ss)$'],
        insensitive: true,
    },
    NO: fourDigit,
    NP: { match: '^(10|21|22|32|33|34|44|45|56|57)\\d{3}$|^(977)$', insensitive: true },
    NZ: fourDigit,
    PK: fiveDigit,
    PL: { match: '^\\d{2}\\-\\d{3}$' },
    PR: { match: '^00[679]\\d{2}([ -]\\d{4})?$' },
    PT: { match: '^\\d{4}\\-\\d{3}?$' },
    RO: sixDigit,
    RU: sixDigit,
    SA: fiveDigit,
    SE: { match: `^[1-9]\\d{2}${SPACE}?\\d{2}$` },
    SG: sixDigit,
    SI: fourDigit,
    SK: { match: `^\\d{3}${SPACE}?\\d{2}$` },
    TH: fiveDigit,
    TN: fourDigit,
    TW: { match: '^\\d{3}(\\d{2,3})?$' },
    UA: fiveDigit,
    US: { match: '^\\d{5}(-\\d{4})?$' },
    ZA: fourDigit,
    ZM: fiveDigit,
};

function regex(value: string, pattern: string, insensitive = false): string {
    return `regexp_matches(${value}, ${sqlLiteral(pattern)}${insensitive ? ', \'i\'' : ''})`;
}

/** One locale: its pattern, and none of its exclusions. */
function localeMatch(value: string, pattern: PostalPattern): string {
    const parts = [regex(value, pattern.match, pattern.insensitive)];
    for (const excluded of pattern.exclude ?? []) {
        parts.push(`NOT ${regex(value, excluded, pattern.insensitive)}`);
    }
    return parts.length === 1 ? parts[0] : `(${parts.join(' AND ')})`;
}

/**
 * `any`: some locale matches. The plain patterns are folded into one alternation per case mode -
 * each alternative keeps its own anchors - so a row runs two regexes plus the four with exclusions.
*/
function anyMatch(value: string): string {
    const plain = Object.values(POSTAL_PATTERNS).filter((p) => !p.exclude);
    const alternation = (patterns: PostalPattern[]) => [...new Set(patterns.map((p) => p.match))]
        .map((match) => `(?:${match})`)
        .join('|');
    const sensitive = plain.filter((p) => !p.insensitive);
    const insensitive = plain.filter((p) => p.insensitive);
    const special = Object.values(POSTAL_PATTERNS).filter((p) => p.exclude);

    return `(${[
        regex(value, alternation(sensitive)),
        regex(value, alternation(insensitive), true),
        ...special.map((p) => localeMatch(value, p)),
    ].join(' OR ')})`;
}

export function postalCodeSQL(
    value: string,
    locale: string | undefined,
    udf: (value: string) => string
): string {
    // no locale means `any`; the config refuses `'any'` spelled out
    const match = locale == null
        ? anyMatch(value)
        : localeMatch(value, POSTAL_PATTERNS[locale]);
    return `CASE WHEN ${isAsciiSql(value)} THEN ${match} ELSE ${udf(value)} END`;
}

/** Whether the emission claims this locale - none (meaning `any`), or one in the table. */
export function postalLocaleApplies(locale: unknown): boolean {
    return locale == null || (typeof locale === 'string' && locale in POSTAL_PATTERNS);
}
