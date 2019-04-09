
import _ from 'lodash';

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

function isWildCard(term: string):boolean {
    let bool = false;
    if (typeof term === 'string') {
        if (term.match('[\?+\*+]')) bool = true;
    }
    return bool;
}

export function wildcardField(field: string) {
    if (isWildCard(field)) {
        // @ts-ignore
        const term = parseWildCard(term);

        // topField = null;
         // @ts-ignore
        return (data: AST): boolean => {
            const resultsArray = recurseDownObject(field || '', data);
            let bool = false;
            if (resultsArray.length === 0) return bool;

            _.each(resultsArray, (value) => {
                try {
                    if (match(value, term)) bool = true;
                } catch (err) {}
            });

            return bool;
        };
    }
    return () => false;
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
