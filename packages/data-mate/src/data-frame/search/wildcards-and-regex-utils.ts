import {
    wildCardToRegex,
    matchWildcard,
    match,
    isString,
    getTypeOf
} from '@terascope/utils';
import { GroupedFields } from '@terascope/data-types';
import { MatchValueFn } from './interfaces';

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
export function findWildcardFields(wildCardField: string, groupedFields: GroupedFields): string[] {
    const fieldSequence = wildCardField.split('.').map(wildCardToRegex);
    return recurse(fieldSequence, groupedFields);
}

function recurse(arr: RegExp[], groupedFields: GroupedFields): string[] {
    if (arr.length === 0) return [];
    const regExpr = arr.shift()!;

    const results: any[] = [];
    for (const field of Object.keys(groupedFields)) {
        if (regExpr.exec(field)) {
            if (arr.length === 0) {
                results.push(field);
            } else if (groupedFields[field].length) {
                const nestedGroupedFields = {};
                for (const nestedField of groupedFields[field]) {
                    const [base, ...parts] = nestedField.split('.');
                    nestedGroupedFields[base] = parts;
                }
                results.push(...recurse(arr.slice(), nestedGroupedFields));
            }
        }
    }
    return results;
}
