'use strict';

const _ = require('lodash');

function newProcessor(context, opConfig) {
    return function stdout(data) {
        if (opConfig.limit === 0) {
            console.log(data); // eslint-disable-line
        } else {
            console.log(_.take(data, opConfig.limit)); // eslint-disable-line
        }
        return data;
    };
}

function schema() {
    return {
        limit: {
            doc: 'Specify a number > 0 to limit the number of results printed to the console log.' +
            'This prints results from the beginning of the result set.',
            default: 0,
            format(val) {
                if (isNaN(val)) {
                    throw new Error('stdout limit must be a number.');
                } else if (val < 0) {
                    throw new Error('stdout limit must be a number greater than 0.');
                }
            }
        }
    };
}

module.exports = {
    newProcessor,
    schema
};
