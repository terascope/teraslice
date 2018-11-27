'use strict';

const _ = require('lodash');

function newProcessor(context, opConfig, jobConfig) {
    const { logger } = jobConfig;

    logger.debug('summarizing...');
    return function processFn(data) {
        // Collect the data types we're interested in
        const urls = {};
        const ips = {};

        data.forEach((item) => {
            countKey(urls, item.url);
            countKey(ips, item.ip);
        });

        // flatten into the records we'll index
        const result = [];
        _.forOwn(urls, (record, url) => {
            result.push({
                _key: url,
                type: 'url',
                count: record,
                first_seen: new Date(),
                last_seen: new Date()
            });
        });

        _.forOwn(ips, (record, ip) => {
            result.push({
                _key: ip,
                type: 'ip',
                count: record,
                first_seen: new Date(),
                last_seen: new Date()
            });
        });

        return result;
    };
}

function countKey(collection, key) {
    if (!Object.hasOwnProperty.call(collection, key)) {
        collection[key] = 1;
    } else {
        collection[key]++;
    }
}

function schema() {
    return {
    };
}

module.exports = {
    newProcessor,
    schema
};
