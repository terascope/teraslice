'use strict';

function newReader(context, opConfig, jobConfig, client) {
    return function(msg, logger) {
        var elasticsearch = require('elasticsearch_api')(client, logger, opConfig);
        var query = elasticsearch.buildQuery(opConfig, msg);
        return elasticsearch.search(query)
    }
}

module.exports = newReader;