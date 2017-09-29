'use strict';

function newReader(context, opConfig, jobConfig, client) {
    return function (msg, logger) {
        const elasticsearch = require('elasticsearch_api')(client, logger, opConfig);
        const query = elasticsearch.buildQuery(opConfig, msg);
        return elasticsearch.search(query);
    };
}

module.exports = newReader;
