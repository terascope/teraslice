'use strict';

const Promise = require('bluebird');


// jsonLines will format the array of data into an array of JSON objects
function json(data, logger) {
    return Promise.map(data, record => JSON.parse(record))
        .filter(element => element !== undefined).catch((err) => {
            logger.error(`There was an error processing the record: ${err}`);
        });
}

module.exports = {
    json
};
