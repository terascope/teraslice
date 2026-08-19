/**
 * Helpers shared by the `sql` emissions on the string function configs.
*/

/**
 * `validator.isAlpha`'s `en-US` alphabet, as an RE2 pattern.
 *
 * Taken from `validator`'s own locale table, not from the function name. Every other locale has a
 * different letter set - and several are not expressible as a simple class - so the emissions that
 * use this claim the DEFAULT locale only.
*/
export const ALPHA_LOCALES = '^[A-Za-z]+$';

/** `validator.isAlphanumeric`'s `en-US` set. */
export const ALPHANUMERIC_LOCALES = '^[0-9A-Za-z]+$';

/** True when no locale was given, so `validator`'s `en-US` default applies. */
export function defaultLocale(locale: unknown): boolean {
    return locale == null || locale === 'en-US';
}
