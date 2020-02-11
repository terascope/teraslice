import { isPlainObject } from '@terascope/utils';
import { BooleanCB } from '../interfaces';

export function regexp(term: string) {
    return function regexpTerm(str: string) {
        if (typeof str !== 'string') return false;
        return matchString(str, term);
    };
}

export function wildcard(term: string) {
    const wildCardQuery = parseWildCard(term);
    return function wildcardTerm(str: string) {
        if (typeof str !== 'string') return false;
        return matchString(str, wildCardQuery);
    };
}

export function findWildcardField(field: string, cb: BooleanCB) {
    return function WildcardField(data: any): boolean {
        const resultsArray = recurseDownObject(field || '', data);
        if (resultsArray.length === 0) return false;
        return resultsArray.some(cb);
    };
}

export function parseWildCard(term: string): string {
    return term
        .replace('.', '\\.{0,1}')
        .replace(/\*/g, '.*')
        .replace(/\?/g, '[^\\n\\r\\s]');
}

export function isWildCardString(term: string): boolean {
    if (typeof term === 'string') {
        if (term.match('[?+*+]')) return true;
    }
    return false;
}

export function matchString(field: any, wildCardQuery: string): boolean {
    const regex = new RegExp(`^${wildCardQuery}$`);
    return typeof field === 'string' && field.match(regex) != null;
}

// city.*   city.deeper.*   city.*.*
function recurseDownObject(field: string, object: object): object[] {
    const fieldSequence = field.split('.').map(parseWildCard);
    return recurse(fieldSequence, object);
}

function recurse(arr: string[], obj: object): any[] {
    if (arr.length === 0) return [];
    const field = arr.shift()!;

    const results: any[] = [];
    for (const [key, value] of Object.entries(obj)) {
        if (matchString(key, field)) {
            if (arr.length === 0) {
                results.push(value);
            } else if (isPlainObject(value)) {
                results.push(...recurse(arr.slice(), value));
            }
        }
    }
    return results;
}
