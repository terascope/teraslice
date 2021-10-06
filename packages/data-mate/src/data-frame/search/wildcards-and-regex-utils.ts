import {
    isPlainObject,
    wildCardToRegex,
    matchWildcard,
    match,
    getTypeOf
} from '@terascope/utils';
import { isString } from 'lodash';
import { MatchValueFn } from './interfaces';

export function regexp(regexStr: unknown): MatchValueFn {
    if (!isString(regexStr)) {
        throw new TypeError(`Expected input string for regexp match, got ${regexStr} (${getTypeOf(regexStr)})`);
    }
    const validRegexStr = `^${regexStr}$`;
    return function regexpTerm(str) {
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
        if (!isString(str)) {
            throw new TypeError(`Expected string for wildcard match, got ${str} (${getTypeOf(str)})`);
        }
        return matchWildcard(wildcardStr, str);
    };
}

export function findWildcardField(field: string, cb: MatchValueFn): MatchValueFn {
    return function _findWildcardField(value): boolean {
        const resultsArray = recurseDownObject(field, value as any);
        if (resultsArray.length === 0) return false;
        return resultsArray.some(cb);
    };
}

// city.*   city.deeper.*   city.*.*
function recurseDownObject(field: string, object: Record<string, any>): Record<string, any>[] {
    const fieldSequence = field.split('.').map(wildCardToRegex);
    return recurse(fieldSequence, object);
}

function recurse(arr: RegExp[], obj: Record<string, any>): any[] {
    if (arr.length === 0) return [];
    const regExpr = arr.shift()!;

    const results: any[] = [];
    for (const [key, value] of Object.entries(obj)) {
        if (regExpr.exec(key)) {
            if (arr.length === 0) {
                results.push(value);
            } else if (isPlainObject(value)) {
                results.push(...recurse(arr.slice(), value));
            }
        }
    }
    return results;
}
