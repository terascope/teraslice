var Promise = require('bluebird');
var buildQuery = require('./../../utils/elastic_utils').buildQuery;
var _ = require('lodash');

function newReader(context, opConfig, jobConfig, client) {
    var logger = jobConfig.logger;

    if (opConfig.full_response) {
        return function(msg) {
            var query = buildQuery(opConfig, msg);
            return new Promise(function(resolve, reject) {
                client.search(query)
                    .then(function(data) {
                        if (data._shards.failed > 0) {
                            var reasons = _.uniq(_.flatMap(data._shards.failures, function(shard) {
                                return shard.reason.type
                            }));

                            if (reasons.length > 1 || reasons[0] !== 'es_rejected_execution_exception') {
                                var errorReason = reasons.join(' | ');
                                logger.error(errorReason);
                                reject(errorReason)
                            }
                            else {
                                // Spot to recurse in the future, will reject for now
                                var errorReason = reasons.join(' | ');
                                logger.error(errorReason);
                                reject(errorReason)
                            }
                        }
                        else {
                            resolve(data)
                        }
                    }).catch(function(err) {
                    console.log('whats the err', err);
                    logger.error(err.body.error.type);
                    reject(err.body.error.type)
                });
            })
        }
    }
    else {
        return function(msg) {
            return new Promise(function(resolve, reject) {
                var query = buildQuery(opConfig, msg);

                client.search(query).then(function(data) {
                    if (data._shards.failed > 0) {
                        var reasons = _.uniq(_.flatMap(data._shards.failures, function(shard) {
                            return shard.reason.type
                        }));

                        if (reasons.length > 1 || reasons[0] !== 'es_rejected_execution_exception') {
                            var errorReason = reasons.join(' | ');
                            logger.error(errorReason);
                            reject(errorReason)
                        }
                        else {
                            // Spot to recurse in the future, will reject for now
                            var errorReason = reasons.join(' | ');
                            logger.error(errorReason);
                            reject(errorReason)
                        }
                    }
                    else {
                        resolve(_.map(data.hits.hits, function(hit) {
                            return hit._source
                        }));
                    }
                }).catch(function(err) {
                    logger.error(err.body.error.type);
                    reject(err.body.error.type)
                });
            })
        }
    }
}

module.exports = newReader;