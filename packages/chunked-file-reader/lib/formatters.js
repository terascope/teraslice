'use strict';

const Promise = require('bluebird');

// No parsing, leaving to reader or a downstream op.
function pass(data) {
    return data;
}

// Each item parsed as JSON.
function json(data, logger) {
    return Promise.map(data, (record) => {
        try {
            return JSON.parse(record);
        } catch (err) {
            logger.error(err, 'failed to parse record');
            return undefined;
        }
    })
        .filter(element => element !== undefined)
        .catch(logger.error);
}

module.exports = {
    pass,
    json
};
