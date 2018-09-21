'use strict';

/* eslint-disable no-unused-vars */

const Promise = require('bluebird');

function newProcessor(context, opConfig, executionConfig) {
    return data => Promise.delay(opConfig.delay).then(() => data);
}

function schema() {
    return {
        ms: {
            default: 100,
            doc: 'Time delay in milliseconds',
            format: 'Number'
        }
    };
}


module.exports = {
    newProcessor,
    schema
};
