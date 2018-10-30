'use strict';

import BaseType from './base';
import { bindThis, ast } from '../../../utils';

export default class RegexType extends BaseType {
    private fields: object;

    constructor(regexDict: object) {
        super();
        this.fields = regexDict;
        bindThis(this, RegexType);
    }

    processAst(ast: ast): ast {
        const { fields, walkAst } = this;

        function parseRegex(node: ast, _field: string): ast {
            const topField = node.field || _field;
            if (fields[topField]) {
                const term = `(data.${topField} ? data.${topField}.match(/^(${node.term})\\b/) !== null : false)`;
                return { field: '__parsed', term };
            }
            return node;
        }
        return walkAst(ast, parseRegex);
    }
}
