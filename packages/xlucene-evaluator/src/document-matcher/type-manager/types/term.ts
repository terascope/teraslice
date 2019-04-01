import BaseType from './base';
import { bindThis } from '../../../utils';
import _ from 'lodash';
import { AST } from '../../../interfaces';

type MaybeString = string|null;

export default class TermType extends BaseType {

    constructor() {
        super();
        bindThis(this, TermType);
    }

    public processAst(node: AST, _field: string): AST {
        let topField: MaybeString = node.field || _field;
        let stringFn;

        if (node.regexpr) {
            stringFn = (str: string): boolean => {
                if (typeof str !== 'string') return false;
                return match(str, node.term);
            };
        }

        if (isWildCard(node.field)) {
            const term = parseWildCard(node.term);

            topField = null;
            stringFn = (data: AST): boolean => {
                const resultsArray = recurseDownObject(node.field || '', data);
                let bool = false;
                if (resultsArray.length === 0) return bool;

                _.each(resultsArray, (value) => {
                    try {
                        if (match(value, term)) bool = true;
                    } catch (err) {}
                });

                return bool;
            };
        } else if (node.wildcard) {
            const wildCardQuery = parseWildCard(node.term);

            stringFn = (str: string): boolean => {
                if (typeof str !== 'string') return false;
                return match(str, wildCardQuery);
            };
        }

        if (stringFn) return this.parseNode(node, stringFn, topField);
        return node;
    }
}

function isWildCard(term: string):boolean {
    let bool = false;
    if (typeof term === 'string') {
        if (term.match('[\?+\*+]')) bool = true;
    }
    return bool;
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
