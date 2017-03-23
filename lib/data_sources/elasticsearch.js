'use strict';

var uuid = require('uuid');
var Promise = require('bluebird');
var _ = require('lodash');
var parseError = require('../utils/error_utils').parseError;

const DOCUMENT_EXISTS = 409;

// Module to manage persistence in Elasticsearch.
// All functions in this module return promises that must be resolved to get the final result.
module.exports = function(client, logger, opConfig) {
    let config = opConfig ? opConfig : {};
    let warning = _warn(logger, 'The elasticsearch cluster queues are overloaded, resubmitting failed queries from bulk');

    function _warn(logger, msg) {
        var loggerFn = _.throttle(function() {
            logger.warn(msg)
        }, 5000);

        return loggerFn;
    }

    function _filterResponse(logger, data, results) {
        var nonRetriableError = false;
        var reason = '';
        var retry = [];
        var items = results.items;

        for (var i = 0; i < items.length; i++) {
            //key could either be create or delete etc, just want the actual data at the value spot
            var item = _.values(items[i])[0];
            if (item.error) {
                // On a create request if a document exists it's not an error.
                // are there cases where this is incorrect?
                if (item.status === DOCUMENT_EXISTS) {
                    continue;
                }

                if (item.error.type === 'es_rejected_execution_exception') {
                    if (i === 0) {
                        retry.push(data[0], data[1])
                    }
                    else {
                        retry.push(data[i * 2], data[i * 2 + 1])
                    }
                }
                else {
                    if (item.error.type !== 'document_already_exists_exception' && item.error.type !== 'document_missing_exception') {
                        nonRetriableError = true;
                        reason = `${item.error.type}--${item.error.reason}`;
                        break;
                    }
                }
            }
        }

        if (nonRetriableError) {
            return {data: [], error: nonRetriableError, reason: reason};
        }

        return {data: retry, error: false};
    }

    function search(query) {
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
                                retry(retryTimer, searchES)
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
                                var errMsg = parseError(err);
                                logger.error(errMsg);
                                reject(errMsg)
                            }
                        }
                        else {
                            var errMsg = parseError(err);
                            logger.error(errMsg);
                            reject(errMsg)
                        }
                    });
            }

            searchES();
        })
    }

    function get(query) {

        return new Promise(function(resolve, reject) {
            var errHandler = _errorHandler(getRecord, query, reject, logger);

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

    function index(query) {

        return new Promise(function(resolve, reject) {
            var errHandler = _errorHandler(indexRecord, query, reject, logger);

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

    function indexWithId(query) {

        return new Promise(function(resolve, reject) {
            var errHandler = _errorHandler(indexRecordID, query, reject, logger);

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

    function create(query) {

        return new Promise(function(resolve, reject) {
            var errHandler = _errorHandler(createRecord, query, reject, logger);

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


    function update(query) {

        return new Promise(function(resolve, reject) {
            var errHandler = _errorHandler(updateRecord, query, reject, logger);

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

    function remove(query) {

        return new Promise(function(resolve, reject) {
            var errHandler = _errorHandler(removeRecord, query, reject, logger);

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

    function retry(retryTimer, fn, data) {
        let timer = Math.floor(Math.random() * (retryTimer.limit - retryTimer.start) + retryTimer.start);

        if (retryTimer.limit < 60000) {
            retryTimer.limit += 10000
        }
        if (retryTimer.start < 30000) {
            retryTimer.start += 5000
        }
        setTimeout(function() {
            fn(data);
        }, timer);
    }

    function _errorHandler(fn, data, reject, logger) {
        let retryTimer = {start: 5000, limit: 10000};

        return function(err) {
            if (_.get(err, 'body.error.type') === 'es_rejected_execution_exception') {
                retry(retryTimer, fn, data)
            }
            else {
                var errMsg = parseError(err);
                logger.error(errMsg);
                reject(errMsg)
            }
        }
    }

    function _checkVersion(str) {
        var num = Number(str.replace(/\./g, ''));
        return num >= 210;
    }

// date slicer
    function version() {
        return client.cluster.stats({})
            .then(function(data) {
                var version = data.nodes.versions[0];

                if (_checkVersion(version)) {
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
                            var errMsg = parseError(err);
                            logger.error(errMsg);
                            return Promise.reject(errMsg)
                        })
                }
            });
    }


    function putTemplate(template, name) {
        return client.indices.putTemplate({body: template, name: name})
            .then(function(results) {
                return results
            })
            .catch(function(err) {
                var errMsg = parseError(err);
                return Promise.reject(errMsg)
            })
    }

    function bulkSend(data) {
        let retryTimer = {start: 5000, limit: 10000};

        return new Promise(function(resolve, reject) {
            function sendData(data) {
                client.bulk({body: data})
                    .then(function(results) {
                        if (results.errors) {
                            var response = _filterResponse(logger, data, results);

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
                                    retry(retryTimer, sendData, response.data);
                                }
                            }
                        }
                        else {
                            resolve(results)
                        }
                    })
                    .catch(function(err) {
                        var errMsg = parseError(err);
                        logger.error(`bulk sender error: ${errMsg}`);
                        reject(`bulk sender error: ${errMsg}`);
                    })
            }

            sendData(data);
        });
    }

    function nodeInfo() {
        return client.nodes.info();
    }

    function nodeStats() {
        return client.nodes.stats()
    }


    function _buildRangeQuery(opConfig, msg) {
        var date_field_name = opConfig.date_field_name;
        var dateObj = {};

        dateObj[date_field_name] = {
            gte: msg.start,
            lt: msg.end
        };

        var body = {
            query: {
                bool: {
                    must: [
                        {range: dateObj}
                    ]
                }
            }
        };
        //TODO this is used for elasticsearch reader when size is to big, this is not called by id_reader as of yet
        if (msg.key) {
            body.query.bool.must.push({wildcard: {_uid: msg.key}})
        }

        if (opConfig.query) {
            body.query.bool.must.push({
                query_string: {
                    query: opConfig.query
                }
            })
        }

        return body;
    }

    function buildQuery(opConfig, msg) {

        var query = {
            index: opConfig.index,
            size: msg.count,
            body: _buildRangeQuery(opConfig, msg)
        };

        return query;
    }

    function index_exists(query) {

        return new Promise(function(resolve, reject) {
            var errHandler = _errorHandler(exists, query, reject, logger);

            function exists() {
                client.indices.exists(query)
                    .then(function(results) {
                        resolve(results);
                    })
                    .catch(errHandler);
            }

            exists();
        })
    }

    function index_create(query) {

        return new Promise(function(resolve, reject) {
            var errHandler = _errorHandler(indexCreate, query, reject, logger);

            function indexCreate() {
                client.indices.create(query)
                    .then(function(results) {
                        resolve(results);
                    })
                    .catch(errHandler);
            }

            indexCreate();
        })
    }

    function index_refresh(query) {

        return new Promise(function(resolve, reject) {
            var errHandler = _errorHandler(indexRefresh, query, reject, logger);

            function indexRefresh() {
                client.indices.refresh(query)
                    .then(function(results) {
                        resolve(results);
                    })
                    .catch(errHandler);
            }

            indexRefresh();
        })
    }

    function index_recovery(query) {

        return new Promise(function(resolve, reject) {
            var errHandler = _errorHandler(indexRecovery, query, reject, logger);

            function indexRecovery() {
                client.indices.recovery(query)
                    .then(function(results) {
                        resolve(results);
                    })
                    .catch(errHandler);
            }

            indexRecovery();
        })
    }

    return {
        search: search,
        get: get,
        index: index,
        indexWithId: indexWithId,
        create: create,
        update: update,
        remove: remove,
        version: version,
        putTemplate: putTemplate,
        bulkSend: bulkSend,
        nodeInfo: nodeInfo,
        nodeStats: nodeStats,
        buildQuery: buildQuery,
        index_exists: index_exists,
        index_create: index_create,
        index_refresh: index_refresh,
        index_recovery: index_recovery
    };
};