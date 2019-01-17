'use strict';

import BaseType from './base';
import { bindThis, AST } from '../../../utils';
import _ from 'lodash';

const fnBaseName = 'strFn';

export default class StringType extends BaseType {

    constructor() {
        super(fnBaseName);
        bindThis(this, StringType);
    }

    private isWildCard(term:string):boolean {
        let bool = false;
        if (typeof term === 'string') {
            if (term.match('[\?+\*+]')) bool = true;
        }
        return bool;
    }

    private parseWildCard(term:string):string {
        return term.replace(/\*/g, '.*').replace(/\?/g, '[^\\n\\r\\s]');
    }

    private match(field: any, wildCardQuery: string): boolean {
        const regex = new RegExp(`^${wildCardQuery}$`);
        return typeof field === 'string' && field.match(regex) !== null;
    }

    // city.*   city.deeper.*   city.*.*
    private recurseDownObject(field:string, object:object):object[] {
        // tslint:disable-next-line no-this-assignment
        const { match, parseWildCard } = this;

        const results: any[] = [];
        const fieldSequence = field.split('.').map(parseWildCard);

        function recurse(arr:string[], obj:object) {
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
        }

        recurse(fieldSequence, object);

        return results;
    }

    public processAst(ast: AST): AST {
        // tslint:disable-next-line no-this-assignment
        const {
            walkAst,
            isWildCard,
            parseWildCard,
            filterFnBuilder,
            createParsedField,
            recurseDownObject,
            match
        } = this;

        function parseRegex(node: AST, _field: string): AST {
            const topField = node.field || _field;

            if (node.regexpr) {
                filterFnBuilder((str: string): boolean => {
                    if (typeof str !== 'string') return false;
                    return match(str, node.term as string);
                });

                return { field: '__parsed', term: createParsedField(topField) };
            }

            if (isWildCard(node.field as string)) {
                const term = parseWildCard(node.term as string);

                filterFnBuilder((data: AST): boolean => {
                    const resultsArray = recurseDownObject(node.field || '', data);
                    let bool = false;

                    if (resultsArray.length === 0) return bool;

                    _.each(resultsArray, (value) => {
                        try {
                            if (match(value, term)) bool = true;
                        } catch (err) {}
                    });

                    return bool;
                });

                return { field: '__parsed', term: createParsedField() };
            }

            if (isWildCard(node.term as string)) {
                const wildCardQuery = parseWildCard(node.term as string);

                filterFnBuilder((str: string): boolean => {
                    if (typeof str !== 'string') return false;
                    return match(str, wildCardQuery);
                });

                return { field: '__parsed', term: createParsedField(topField) };
            }

            return node;
        }
        return walkAst(ast, parseRegex);
    }
}
