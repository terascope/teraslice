import {
    wildCardToRegex, matchWildcard, match,
    isString, getTypeOf
} from '@terascope/core-utils';
import { MatchValueFn } from '../../interfaces.js';

export function regexp(regexStr: unknown): MatchValueFn {
    if (!isString(regexStr)) {
        throw new TypeError(`Expected input string for regexp match, got ${regexStr} (${getTypeOf(regexStr)})`);
    }
    const validRegexStr = `^${regexStr}$`;
    return function regexpTerm(str) {
        if (str == null) return false;
        if (!isString(str)) {
            throw new TypeError(`Expected string for regexp match, got ${str} (${getTypeOf(str)})`);
        }
        return match(validRegexStr, str) != null;
    };
}

export function wildcard(wildcardStr: unknown): MatchValueFn {
    if (!isString(wildcardStr)) {
        throw new TypeError(`Expected input string for wildcard match, got ${wildcardStr} (${getTypeOf(wildcardStr)})`);
    }
    return function wildcardTerm(str) {
        if (str == null) return false;
        if (!isString(str)) {
            throw new TypeError(`Expected string for wildcard match, got ${str} (${getTypeOf(str)})`);
        }
        return matchWildcard(wildcardStr, str);
    };
}

/**
 * Match the fields name
 * city.*   city.deeper.*   city.*.*
*/
export function findWildcardFields(wildCardField: string, fields: string[]): string[] {
    const regExpr = wildCardToRegex(wildCardField);
    return fields.filter((f) => regExpr.test(f));
}
