var Promise = require('bluebird');
var buildQuery = require('./../../utils/elastic_utils').buildQuery;

function newReader(context, opConfig, jobConfig, client) {
    if (opConfig.full_response) {
        return function(msg) {
            var query = buildQuery(opConfig, msg);
            return client.search(query);
        }
    }
    else {
        return function(msg) {
            return new Promise(function(resolve, reject) {
                var query = buildQuery(opConfig, msg);

                client.search(query).then(function(data) {
                    resolve(data.hits.hits.map(function(data) {
                        return data._source
                    }))
                });
            })
        }
    }
}

module.exports = newReader;