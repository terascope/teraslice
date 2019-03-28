import BaseType from './base';
import { bindThis } from '../../../utils';
import _ from 'lodash';
import { AST, BooleanCB } from '../../../interfaces';

export default class TermType extends BaseType {

    constructor() {
        super();
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

        const parseStringNodes = (node: AST, _field: string) => {
            const topField = node.field || _field;
            let stringFn: BooleanCB;

            if (node.regexpr) {
                stringFn = (str: string): boolean => {
                    if (typeof str !== 'string') return false;
                    return this.match(str, node.term);
                };
            }

            if (this.isWildCard(node.field)) {
                const term = this.parseWildCard(node.term);

                stringFn = (data: AST): boolean => {
                    const resultsArray = this.recurseDownObject(node.field || '', data);
                    let bool = false;

                    if (resultsArray.length === 0) return bool;

                    _.each(resultsArray, (value) => {
                        try {
                            if (this.match(value, term)) bool = true;
                        } catch (err) {}
                    });

                    return bool;
                };
            }

            if (node.wildcard) {
                const wildCardQuery = this.parseWildCard(node.term);

                stringFn = (str: string): boolean => {
                    if (typeof str !== 'string') return false;
                    return this.match(str, wildCardQuery);
                };
            }
            // @ts-ignore
            if (stringFn) return this.parseAST(node, stringFn, topField);

            return node;
        };

        return this.walkAst(ast, parseStringNodes);
    }
}
