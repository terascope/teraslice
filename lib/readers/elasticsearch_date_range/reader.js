var elasticsearchReader = require('../../cluster/storage/backends/elasticsearch').reader;

function newReader(context, opConfig, jobConfig, client) {
    return function(msg, logger) {
        return elasticsearchReader(context, client, opConfig, msg, logger)
    }
}

module.exports = newReader;