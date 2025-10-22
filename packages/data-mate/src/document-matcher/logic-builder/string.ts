import {
    isPlainObject, wildCardToRegex, matchWildcard,
    match
} from '@terascope/core-utils';
import { BooleanCB } from '../interfaces.js';

export function regexp(regexStr: string | undefined) {
    if (regexStr === undefined) return () => false;

    return function regexpTerm(str: string): boolean {
        return match(`^${regexStr}$`, str) != null;
    };
}

export function wildcard(wildcardStr: string | undefined) {
    if (wildcardStr === undefined) return () => false;

    return function wildcardTerm(str: string): boolean {
        return matchWildcard(wildcardStr, str);
    };
}

export function findWildcardField(field: string, cb: BooleanCB) {
    return function WildcardField(data: Record<string, any>): boolean {
        const resultsArray = recurseDownObject(field || '', data);
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
