'use strict';

const BaseType = require('./base');
const { bindThis } = require('../../../utils');

class RegexType extends BaseType {
    constructor(regexDict) {
        super();
        this.fields = regexDict;
        bindThis(this, RegexType);
    }

    processAst(ast) {
        const { fields, walkAst } = this;

        function parseRegex(node, _field) {
            const topField = node.field || _field;
            if (fields[topField]) {
                const term = `data.${topField}.match(/^(${node.term})\\b/) !== null`;
                return { field: '__parsed', term }
            }
            return node;
        }
        return walkAst(ast, parseRegex);
    }
}

module.exports = RegexType;
