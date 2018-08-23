'use strict';

const _ = require('lodash');

function newProcessor(context, opConfig) {
    return function processor(data) {
        const results = {};
        data.forEach((doc) => {
            if (_.has(doc, opConfig.field)) {
                const tld = doc[opConfig.field].split('.').slice(-1)[0];
                _.set(results, tld, _.get(results, tld, 0) + 1);
            }
        });

        const finalCounts = [];
        _.keys(results).forEach((key) => {
            finalCounts.push({
                _id: key,
                count: results[key]
            });
        });

        return finalCounts;
    };
}


function schema() {
    return {
        field: {
            doc: 'The name of the field in the input document that contains the TLD to count',
            default: null,
            format: 'required_String'
        }
    };
}

module.exports = {
    newProcessor,
    schema
};
