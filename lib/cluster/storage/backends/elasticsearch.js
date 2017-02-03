'use strict';

var uuid = require('uuid');
var Promise = require('bluebird');
var _ = require('lodash');
var moment = require('moment');
var filterResponse = require('../../../utils/elastic_utils').filterResponse;
var elasticError = require('../../../utils/error_utils').elasticError;

// Module to manage persistence in Elasticsearch.
// All functions in this module return promises that must be resolved to get the final result.


function search(client, opConfig, query, logger) {
    let config = opConfig ? opConfig : {};
    let retryTimer = {start: 5000, limit: 10000};
    let isCounting = query.size === 0;

    return new Promise(function(resolve, reject) {
        function searchES() {
            client.search(query)
                .then(function(data) {
                    if (data._shards.failed > 0) {
                        var reasons = _.uniq(_.flatMap(data._shards.failures, function(shard) {
                            return shard.reason.type
                        }));

                        if (reasons.length > 1 || reasons[0] !== 'es_rejected_execution_exception') {
                            var errorReason = reasons.join(' | ');
                            logger.error('Not all shards returned successful, shard errors: ', errorReason);
                            reject(errorReason)
                        }
                        else {
                            let timer = Math.floor(Math.random() * (retryTimer.limit - retryTimer.start) + retryTimer.start);

                            if (retryTimer.limit < 60000) {
                                retryTimer.limit += 10000
                            }
                            if (retryTimer.start < 30000) {
                                retryTimer.start += 5000
                            }
                            setTimeout(function() {
                                searchES()
                            }, timer)

                        }
                    }
                    else {
                        if (isCounting) {
                            resolve(data.hits.total)
                        }

                        if (config.full_response) {
                            resolve(data)
                        }
                        else {
                            resolve(_.map(data.hits.hits, function(hit) {
                                return hit._source
                            }));
                        }
                    }
                })
                .catch(function(err) {
                    if (_.get(err, 'body.error.type') === 'reduce_search_phase_exception') {
                        var retriableError = _.every(err.body.error.root_cause, function(shard) {
                            return shard.type === 'es_rejected_execution_exception';
                        });
                        //scaffolding for retries, just reject for now
                        if (retriableError) {
                            var errMsg = elasticError(err);
                            logger.error(errMsg);
                            reject(errMsg)
                        }
                    }
                    else {
                        var errMsg = elasticError(err);
                        logger.error(errMsg);
                        reject(errMsg)
                    }
                });
        }

        searchES();
    })
}

function get(client, opConfig, query, logger) {
    let retryTimer = {start: 5000, limit: 10000};

    return new Promise(function(resolve, reject) {
        var errHandler = errorHandler(retryTimer, getRecord, reject, logger);

        function getRecord() {
            client.get(query)
                .then(function(result) {
                    resolve(result._source)
                })
                .catch(errHandler);
        }

        getRecord();
    })
}

function index(client, opConfig, query, logger) {
    let retryTimer = {start: 5000, limit: 10000};

    return new Promise(function(resolve, reject) {
        var errHandler = errorHandler(retryTimer, indexRecord, reject, logger);

        function indexRecord() {
            client.index(query)
                .then(function(result) {
                    resolve(record);
                })
                .catch(errHandler);
        }

        indexRecord();
    })
}

function indexWithId(client, opConfig, query, logger) {
    let retryTimer = {start: 5000, limit: 10000};

    return new Promise(function(resolve, reject) {
        var errHandler = errorHandler(retryTimer, indexRecordID, reject, logger);

        function indexRecordID() {
            client.index(query)
                .then(function(result) {
                    resolve(query.body);
                })
                .catch(errHandler);
        }

        indexRecordID();
    })
}

function create(client, opConfig, query, logger) {
    let retryTimer = {start: 5000, limit: 10000};

    return new Promise(function(resolve, reject) {
        var errHandler = errorHandler(retryTimer, createRecord, reject, logger);

        function createRecord() {
            client.create(query)
                .then(function(result) {
                    resolve(query.body);
                })
                .catch(errHandler);
        }

        createRecord();
    })
}


function update(client, opConfig, query, logger) {
    let retryTimer = {start: 5000, limit: 10000};

    return new Promise(function(resolve, reject) {
        var errHandler = errorHandler(retryTimer, updateRecord, reject, logger);

        function updateRecord() {
            client.update(query)
                .then(function(result) {
                    resolve(query.body.doc);
                })
                .catch(errHandler);
        }

        updateRecord();
    })
}

function remove(client, opConfig, query, logger) {
    let retryTimer = {start: 5000, limit: 10000};

    return new Promise(function(resolve, reject) {
        var errHandler = errorHandler(retryTimer, removeRecord, reject, logger);

        function removeRecord() {
            client.delete(query)
                .then(function(result) {
                    resolve(result.found);
                })
                .catch(errHandler);
        }

        removeRecord();
    });
}

//utility slicer

function parseDate(date) {
    var result;

    if (moment(new Date(date)).isValid()) {
        result = moment(new Date(date));
    }
    else {
        var ms = dateMath.parse(date);
        result = moment(ms)
    }

    return result;
}


function errorHandler(retryTimer, fn, reject, logger) {
    return function(err) {
        if (_.get(err, 'body.error.type') === 'es_rejected_execution_exception') {
            let timer = Math.floor(Math.random() * (retryTimer.limit - retryTimer.start) + retryTimer.start);

            if (retryTimer.limit < 60000) {
                retryTimer.limit += 10000
            }
            if (retryTimer.start < 30000) {
                retryTimer.start += 5000
            }
            setTimeout(function() {
                fn();
            }, timer);
        }
        else {
            var errMsg = elasticError(err);
            logger.error(errMsg);
            reject(errMsg)
        }
    }
}
// slicer get dates

function autoDates(client, opConfig, query, givenDate, order, dateFormat, logger) {
    return client.search(query)
        .then(function(data) {
            if (data.hits.hits.length === 0) {
                return null
            }

            if (data.hits.hits[0] && data.hits.hits[0]._source[opConfig.date_field_name] === undefined) {
                return Promise.reject(`date_field_name: "${opConfig.date_field_name}" for index: ${opConfig.index} does not exist`);
            }

            if (givenDate) {
                return givenDate;
            }

            if (order === 'start') {
                return parseDate(data.hits.hits[0]._source[opConfig.date_field_name])
            }
            else {
                //end date is non-inclusive, adding 1s so range will cover it
                var date = data.hits.hits[0]._source[opConfig.date_field_name];
                var time = moment(date).add(1, 's');
                return parseDate(time.format(dateFormat));
            }
        })
        .catch(function(err) {
            var errMsg = elasticError(err);
            logger.error(errMsg);
            return Promise.reject(errMsg);
        });
}

function checkVersion(str) {
    var num = Number(str.replace(/\./g, ''));
    return num >= 210;
}

// date slicer
function elasticsearchVersion(client, opConfig, logger) {
    return client.cluster.stats({})
        .then(function(data) {
            var version = data.nodes.versions[0];

            if (checkVersion(version)) {
                return client.indices.getSettings({})
                    .then(function(results) {
                        if (results[opConfig.index]) {
                            var data = results[opConfig.index].settings.index.max_result_window;
                            var window = data ? data : 10000;

                            logger.warn(`max_result_window for index: ${opConfig.index} is set at ${window} . On very large indices it is possible that a slice can not be divided to stay below this limit. If that occurs an error will be thrown by Elasticsearch and the slice can not be processed. Increasing max_result_window in the Elasticsearch index settings will resolve the problem.`);
                        }
                        else {
                            return Promise.reject('index specified in reader does not exist')
                        }
                    }).catch(function(err) {
                        var errMsg = elasticError(err);
                        logger.error(errMsg);
                        return Promise.reject(errMsg)
                    })
            }
        });
}


function putTemplate(client, template, name) {
    return client.indices.putTemplate({body: template, name: name})
        .then(function(results) {
            return results
        })
        .catch(function(err) {
            var errMsg = elasticError(err);
            return Promise.reject(errMsg)
        })
}

function bulkSend(client, data, warning, logger) {
    return new Promise(function(resolve, reject) {
        function sendData(client, data) {
            client.bulk({body: data})
                .then(function(results) {
                    if (results.errors) {
                        var response = filterResponse(logger, data, results);

                        if (response.error) {
                            reject(response.reason)
                        }
                        else {
                            //may get doc already created error, if so just return
                            if (response.data.length === 0) {
                                resolve(results)
                            }
                            else {
                                warning();
                                setTimeout(function() {
                                    sendData(client, response.data)
                                }, 3000)
                            }
                        }
                    }
                    else {
                        resolve(results)
                    }
                })
                .catch(function(err) {
                    var errMsg = elasticError(err);
                    logger.error(`bulk sender error: ${errMsg}`);
                    reject(`bulk sender error: ${errMsg}`);
                })
        }

        sendData(client, data);
    });
}

function nodeInfo(client) {
    return client.nodes.info();
}

function nodeStats(client) {
    return client.nodes.stats()
}


module.exports = {
    search: search,
    get: get,
    index: index,
    indexWithId: indexWithId,
    create: create,
    update: update,
    remove: remove,
    autoDates: autoDates,
    elasticsearchVersion: elasticsearchVersion,
    putTemplate: putTemplate,
    bulkSend: bulkSend,
    nodeInfo: nodeInfo,
    nodeStats: nodeStats
};