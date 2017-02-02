'use strict';

var elasticsearchReader = require('../../cluster/storage/backends/elasticsearch').search;
var buildQuery = require('./../../utils/elastic_utils').buildQuery;

function newReader(context, opConfig, jobConfig, client) {
    return function(msg, logger) {
        var query = buildQuery(opConfig, msg);
        return elasticsearchReader(client, opConfig, query, logger)
    }
}

module.exports = newReader;