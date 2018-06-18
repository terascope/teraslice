'use strict';

function newReader(context, opConfig, executionConfig, client) {
    return (msg, logger) => {
        const elasticsearch = require('@terascope/elasticsearch-api')(client, logger, opConfig);
        const query = elasticsearch.buildQuery(opConfig, msg);
        return elasticsearch.search(query);
    };
}

module.exports = newReader;
