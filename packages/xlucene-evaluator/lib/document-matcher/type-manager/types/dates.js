'use strict';

const BaseType = require('./base');
const { bindThis } = require('../../../utils');
const lodash = require('lodash');

//TODO: handle datemath 

class DateType extends BaseType {
    constructor(dateFieldDict) {
        super();
        this.fields = dateFieldDict;
        bindThis(this, DateType);
    }

    processAst(ast) {
        const { fields } = this;

        function parseDates(node, _field) {
            const topField = node.field || _field;

            function convert(value) {
                const results = new Date(value).getTime();
                if (results) return results;
                return value;
            }

            if (fields[topField]) {
                if (node.term) node.term = convert(node.term);
                if (node.term_max) node.term_max = convert(node.term_max);
                if (node.term_min) node.term_min = convert(node.term_min);
            }
            return node;
        }

        return this.walkAst(ast, parseDates);
    }

    formatData(data) {
        const { fields } = this;
        //TODO: add error handling
        for (const key in fields) {
            if (data[key]) {
                data[key] = new Date(data[key]).getTime();
            }
        }
        return data;
    }

}

module.exports = DateType;