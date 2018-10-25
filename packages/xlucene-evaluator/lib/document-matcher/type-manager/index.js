'use strict';

const DateType = require('./types/dates');
const IpType = require('./types/ip');
const GeoType = require('./types/geo');
const RegexType = require('./types/regex');

const typeMapping = {
    date: DateType,
    ip: IpType,
    geo: GeoType,
    regex: RegexType
};

class TypeManager {
    constructor(typeConfig) {
        const typeList = [];        
        this.typeList = this._buildFieldListConfig(typeConfig);
    }

    _buildFieldListConfig(typeConfig) {
        const typeList = [];
        const results = {};
        
        for (const field in typeConfig) {
            const type = typeConfig[field];
            if (typeMapping[type]) {
                if (!results[type]) results[type] = {};
                results[type][field] = true;
            }
        }

        for (const type in results) {
            const TypeClass = typeMapping[type];
            typeList.push(new TypeClass(results[type]));
        }

        return typeList;
    }

    processAst(ast) {
        return this.typeList.reduce((ast, type) => {
            return type.processAst(ast);
        }, ast);
    }

    formatData(doc) {
        return this.typeList.reduce((doc, type) => {
            return type.formatData(doc);
        }, doc);
    }

    injectTypeFilterFns() {
        return this.typeList.reduce((prev, type) => {
            const filterFns = type.injectTypeFilterFns();
            if (filterFns !== null) {
                Object.assign(prev, filterFns);
            }
            return prev;
        }, {});
    }
}

module.exports = TypeManager;
