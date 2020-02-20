import {
    isPlainObject,
    wildCardToRegex,
    matchWildcard,
    match
} from '@terascope/utils';
import { BooleanCB } from '../interfaces';

export function regexp(regexStr: string) {
    return function regexpTerm(str: string) {
        return match(`^${regexStr}$`, str) != null;
    };
}

export function wildcard(wildcardStr: string) {
    return function wildcardTerm(str: string) {
        return matchWildcard(wildcardStr, str);
    };
}

export function findWildcardField(field: string, cb: BooleanCB) {
    return function WildcardField(data: any): boolean {
        const resultsArray = recurseDownObject(field || '', data);
        if (resultsArray.length === 0) return false;
        return resultsArray.some(cb);
    };
}

// city.*   city.deeper.*   city.*.*
function recurseDownObject(field: string, object: object): object[] {
    const fieldSequence = field.split('.').map(wildCardToRegex);
    return recurse(fieldSequence, object);
}

function recurse(arr: RegExp[], obj: object): any[] {
    if (arr.length === 0) return [];
    const regx = arr.shift()!;

    const results: any[] = [];
    for (const [key, value] of Object.entries(obj)) {
        if (regx.exec(key)) {
            if (arr.length === 0) {
                results.push(value);
            } else if (isPlainObject(value)) {
                results.push(...recurse(arr.slice(), value));
            }
        }
    }
    return results;
}
