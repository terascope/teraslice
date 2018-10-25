'use strict';

const StringType = require('./types/string');
const DateType = require('./types/dates');
const IpType = require('./types/ip');

class TypeManager {
    constructor(typeConfig) {
        const typeList = [];

        const config = this._buildFieldListConfig(typeConfig)
        if (config.date ) {
            typeList.push(new DateType(config.date))
        }

        if (config.ip ) {
            console.log('injecting ip')
            typeList.push(new IpType(config.ip))
        }
            // if (typeConfig[key] === 'geo' ) {
            //     hasGeoTypes = true;
            // }
            // if (typeConfig[key] === 'regex' ) {
            //     regexField = key;
            // }
      //  }
        

        // by default we parse everything by strings so it needs to be included
        typeList.push(new StringType())
        this.typeList = typeList;
    }

    _buildFieldListConfig(typeConfig) {
        const results = {};
        for (const key in typeConfig) {
            if (typeConfig[key] === 'date' ) {
                if (!results.date) results.date = {};
                results.date[key] = true;
            }
            if (typeConfig[key] === 'ip' ) {
                if (!results.ip) results.ip = {};
                results.ip[key] = true;
            }
            // if (typeConfig[key] === 'regex' ) {
            //     regexField = key;
            // }
        }
        return results;
    }

    processAst(ast) {
        return this.typeList.reduce((ast, type) => {
            return type.processAst(ast)
        }, ast)
    }

    formatData(doc) {
        return this.typeList.reduce((doc, type) => {
            return type.formatData(doc)
        }, doc)
    }

    injectTypeFilterFns() {
        return this.typeList.reduce((prev, type) => {
            if (type.injectTypeFilterFns) {
                Object.assign(prev, type.injectTypeFilterFns)
            }
            return prev
        }, {});
    }
}

module.exports = TypeManager;