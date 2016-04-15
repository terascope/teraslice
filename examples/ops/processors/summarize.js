'use strict';

var _ = require('lodash');

function newProcessor(context, opConfig, jobConfig) {
    var logger = jobConfig.logger;

    return function(data) {
        var records = {};

        // Collect the data types we're interested in
        var urls = {};
        var ips = {};

        data.forEach(function(item) {
            count_key(urls, item.url);
            count_key(ips, item.ip);
        });

        // flatten into the records we'll index
        var result = [];
        _.forOwn(urls, function(record, url) {
            result.push({
                _key: url,
                type: 'url',
                count: record,
                first_seen: new Date(),
                last_seen: new Date()
            });
        });

        _.forOwn(ips, function(record, ip) {
            result.push({
                _key: ip,
                type: 'ip',
                count: record,
                first_seen: new Date(),
                last_seen: new Date()
            });
        });

        return result;
    }
}

function count_key(collection, key) {
    if (! collection.hasOwnProperty(key)) {
        collection[key] = 1;
    }
    else {
        collection[key]++;
    }
}

function schema(){
    return {
    }
}

module.exports = {
    newProcessor: newProcessor,
    schema: schema
};