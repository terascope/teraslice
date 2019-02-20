import BaseType from './base';
import { bindThis } from '../../../utils';
import _ from 'lodash';
import { AST } from '../../../interfaces';

const fnBaseName = 'strFn';

export default class TermType extends BaseType {

    constructor() {
        super(fnBaseName);
        bindThis(this, TermType);
    }

    private isWildCard(term: string):boolean {
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
        return typeof field === 'string' && field.match(regex) != null;
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

        function parseRegex(node: AST, _field: string) {
            const topField = node.field || _field;

            if (node.regexpr) {
                filterFnBuilder((str: string): boolean => {
                    if (typeof str !== 'string') return false;
                    return match(str, node.term);
                });

                return {
                    type: 'term',
                    field: '__parsed',
                    term: createParsedField(topField)
                };
            }

            if (isWildCard(node.field)) {
                const term = parseWildCard(node.term);

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

                return {
                    type: 'term',
                    field: '__parsed',
                    term: createParsedField()
                };
            }

            if (node.wildcard) {
                const wildCardQuery = parseWildCard(node.term);

                filterFnBuilder((str: string): boolean => {
                    if (typeof str !== 'string') return false;
                    return match(str, wildCardQuery);
                });

                return {
                    type: 'term',
                    field: '__parsed',
                    term: createParsedField(topField)
                };
            }

            return node;
        }
        return walkAst(ast, parseRegex);
    }
}
