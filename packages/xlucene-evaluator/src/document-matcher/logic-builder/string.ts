
import _ from 'lodash';
import { BooleanCB } from '../../interfaces';
import { any } from 'rambda';

export function regexp(term: string) {
    return (str:string) => {
        if (typeof str !== 'string') return false;
        return match(str, term);
    };
}

export function wildcard(term: string) {
    const wildCardQuery = parseWildCard(term);
    return (str: string) => {
        if (typeof str !== 'string') return false;
        return match(str, wildCardQuery);
    };
}

export function isWildCard(term: string):boolean {
    let bool = false;
    if (typeof term === 'string') {
        if (term.match('[\?+\*+]')) bool = true;
    }
    return bool;
}

export function findWildcardField(field: string, cb: BooleanCB) {
    return (data: any): boolean => {
        const resultsArray = recurseDownObject(field || '', data);
        if (resultsArray.length === 0) return false;
        return any(cb, resultsArray);
    };
}

function parseWildCard(term:string):string {
    return term.replace(/\*/g, '.*').replace(/\?/g, '[^\\n\\r\\s]');
}

function match(field: any, wildCardQuery: string): boolean {
    const regex = new RegExp(`^${wildCardQuery}$`);
    return typeof field === 'string' && field.match(regex) != null;
}

// city.*   city.deeper.*   city.*.*
function recurseDownObject(field:string, object:object):object[] {
    const results: any[] = [];
    const fieldSequence = field.split('.').map(parseWildCard);

    const recurse = (arr:string[], obj:object) =>  {
        if (arr.length === 0) return;
        const field = arr.shift() as string;

        _.forOwn(obj, (value, key) => {
            if (match(key, field)) {
                if (arr.length === 0) {
                    results.push(value);
                } else {
                    if (_.isPlainObject(value)) recurse(arr.slice(), value);
                }
            }
        });
    };

    recurse(fieldSequence, object);

    return results;
}
