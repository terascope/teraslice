'use strict';

var buildQuery = require('./../../utils/elastic_utils').buildQuery;

function newReader(context, opConfig, jobConfig, client) {
    return function(msg, logger) {
        var query = buildQuery(opConfig, msg);
        var elasticsearch = require('../../cluster/storage/backends/elasticsearch')(client, logger, opConfig);
        return elasticsearch.search(query)
    }
}

module.exports = newReader;