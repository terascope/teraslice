'use strict';

var uuid = require('uuid');
var Promise = require('bluebird');
var _ = require('lodash');
var fs = require('fs');
var moment = require('moment');
var filterResponse = require('../../../utils/elastic_utils').filterResponse;
var warn = require('../../../utils/elastic_utils').warn;
var elasticError = require('../../../utils/error_utils').elasticError;
var buildQuery = require('../../../utils/elastic_utils').buildQuery;

// Module to manage persistence in Elasticsearch.
// All functions in this module return promises that must be resolved to get the final result.

//TODO ID reader
function oreader(context, client, opConfig, msg, logger) {
    var query = {
        index: opConfig.index,
        size: msg.count ? msg.count : 200000,
        body: {
            query: {
                wildcard: {
                    _uid: msg.key
                }
            }
        }
    };
    //Duplicate
    return new Promise(function(resolve, reject) {
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
                        // Spot to recurse in the future, will reject for now
                        var errorReason = reasons.join(' | ');
                        logger.error('Not all shards returned successful, shard errors: ', errorReason);
                        reject(errorReason)
                    }
                }
                else {
                    if (opConfig.full_response) {
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
                var errMsg = elasticError(err);
                logger.error(errMsg);
                reject(errMsg)
            });
    })
}


//TODO date reader
function reader(context, client, opConfig, msg, logger) {
    return new Promise(function(resolve, reject) {
        var query = buildQuery(opConfig, msg);

        client.search(query).then(function(data) {
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
                    // Spot to recurse in the future, will reject for now
                    var errorReason = reasons.join(' | ');
                    logger.error('Not all shards returned successful, shard errors: ', errorReason);
                    reject(errorReason)
                }
            }
            else {
                if (opConfig.full_response) {
                    resolve(data)
                }
                else {
                    resolve(_.map(data.hits.hits, function(hit) {
                        return hit._source
                    }));
                }
            }
        }).catch(function(err) {
            var errMsg = elasticError(err);
            logger.error(errMsg);
            reject(errMsg)
        });
    })
}

//TODO slicer getCount dateRange

function queryCount(client, query, logger) {
    return new Promise(function(resolve, reject) {
        client.search(query)
            .then(function(results) {
                if (results._shards.failed > 0) {
                    var reasons = _.uniq(_.flatMap(results._shards.failures, function(shard) {
                        return shard.reason.type
                    }));

                    if (reasons.length > 1 || reasons[0] !== 'es_rejected_execution_exception') {
                        var errorReason = reasons.join(' | ');
                        logger.error(`Multiple elasticsearch errors occurred while determining count of slice: ${errorReason}`);
                        reject(errorReason)
                    }
                    else {
                        // Spot to recurse in the future, will reject for now
                        var errorReason = reasons.join(' | ');
                        logger.error(`elasticsearch error occurred while determining count of slice: ${errorReason}`);
                        reject(errorReason)
                    }
                }
                else {
                    resolve(results.hits.total)
                }
            })
            .catch(function(err) {
                var errMsg = elasticError(err);
                logger.error(`error while processing count of slice`, errMsg);
                reject(errMsg)
            });
    })
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

function createStore(context, index_name, record_type, id_field, bulk_size) {
    var logger = context.foundation.makeLogger('elasticsearch_backend', 'elasticsearch_backend', {module: 'elasticsearch_backend'});
    var config = context.sysconfig.teraslice;

    var client;

    // Buffer to build up bulk requests.
    var bulkQueue = [];
    var savingBulk = false; // serialize save requests.

    var bulkSize = 500;
    if (bulk_size) bulkSize = bulk_size;

    function get(record_id) {
        logger.trace(`getting record id: ${record_id}`);
        let retryTimer = {start: 5000, limit: 10000};

        return new Promise(function(resolve, reject) {
            function getRecord() {
                client.get({
                    index: index_name,
                    type: record_type,
                    id: record_id
                })
                    .then(function(result) {
                        resolve(result._source)
                    })
                    .catch(function(err) {
                        if (_.get(err, 'body.error.type') === 'es_rejected_execution_exception') {
                            let timer = Math.floor(Math.random() * (retryTimer.limit - retryTimer.start) + retryTimer.start);

                            if (retryTimer.limit < 60000) {
                                retryTimer.limit += 10000
                            }
                            if (retryTimer.start < 30000) {
                                retryTimer.start += 5000
                            }
                            setTimeout(function() {
                                getRecord();
                            }, timer);
                        }
                        else {
                            var errMsg = elasticError(err);
                            logger.error(`error getting record id: ${record_id}`);
                            logger.error(errMsg);
                            reject(errMsg)
                        }
                    });
            }

            getRecord();
        })

    }

    function search(query, from, size, sort) {
        logger.trace(`elasticsearch search call, sort: ${sort}, from: ${from}, size: ${size}, query: `, query);
        let retryTimer = {start: 5000, limit: 10000};

        var esQuery = {
            index: index_name,
            from: from,
            size: size,
            sort: sort
        };

        if (typeof query === 'string') {
            esQuery.q = query
        }
        else {
            esQuery.body = query
        }

        return new Promise(function(resolve, reject) {
            function searchES() {
                client.search(esQuery)
                    .then(function(results) {
                        if (results._shards.failed > 0) {
                            var reasons = _.uniq(_.flatMap(results._shards.failures, function(shard) {
                                return shard.reason.type
                            }));

                            if (reasons.length > 1 || reasons[0] !== 'es_rejected_execution_exception') {
                                var errorReason = reasons.join(' | ');
                                logger.error(errorReason);
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
                            var final = _.map(results.hits.hits, function(hit) {
                                return hit._source
                            });

                            resolve(final)
                        }
                    })
                    .catch(function(err) {
                        var errMsg = elasticError(err);
                        logger.error(`error elasticsearch search call, sort: ${sort}, from: ${from}, size: ${size}, query: `, query);
                        logger.error(errMsg);
                        reject(errMsg)
                    });
            }

            searchES();
        });
    }

    function count(query, from, sort) {
        logger.trace(`elasticsearch count call, sort: ${sort}, from: ${from}, query:`, query);
        var esQuery = {
            index: index_name,
            from: from,
            size: 0,
            sort: sort
        };
        let retryTimer = {start: 5000, limit: 10000};

        if (typeof query === 'string') {
            esQuery.q = query
        }
        else {
            esQuery.body = query
        }

        return new Promise(function(resolve, reject) {
            function getCount() {
                client.search(esQuery)
                    .then(function(results) {
                        if (results._shards.failed > 0) {
                            var reasons = _.uniq(_.flatMap(results._shards.failures, function(shard) {
                                return shard.reason.type
                            }));

                            if (reasons.length > 1 || reasons[0] !== 'es_rejected_execution_exception') {
                                var errorReason = reasons.join(' | ');
                                logger.error(errorReason);
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
                                    getCount();
                                }, timer)

                            }
                        }
                        else {
                            resolve(results.hits.total)
                        }
                    })
                    .catch(function(err) {
                        if (_.get(err, 'body.error.type') === 'reduce_search_phase_exception') {
                            var retriableError = _.every(err.body.error.root_cause, function(shard) {
                                return shard.type === 'es_rejected_execution_exception';
                            });
                            //scaffolding for retries, just reject for now                
                            if (retriableError) {
                                reject(err.body.error.type)
                            }
                        }
                        else {
                            var errMsg = elasticError(err);
                            logger.trace(`error elasticsearch count call, sort: ${sort}, from: ${from}, query:`, query);
                            logger.error(errMsg);

                            reject(errMsg)
                        }
                    });
            }

            getCount();
        });
    }

    /*
     * index saves a record to elasticsearch allowing automatic
     * ID creation
     */
    function index(record) {
        logger.trace(`indexing record`, record);
        let retryTimer = {start: 5000, limit: 10000};

        return new Promise(function(resolve, reject) {
            function indexRecord() {
                client.index({
                    index: index_name,
                    type: record_type,
                    body: record,
                    refresh: true
                })
                    .then(function(result) {
                        resolve(record);
                    })
                    .catch(function(err) {
                        if (_.get(err, 'body.error.type') === 'es_rejected_execution_exception') {
                            let timer = Math.floor(Math.random() * (retryTimer.limit - retryTimer.start) + retryTimer.start);

                            if (retryTimer.limit < 60000) {
                                retryTimer.limit += 10000
                            }
                            if (retryTimer.start < 30000) {
                                retryTimer.start += 5000
                            }
                            setTimeout(function() {
                                indexRecord();
                            }, timer)
                        }
                        else {
                            var errMsg = elasticError(err);
                            logger.error(`error indexing record`, record);
                            logger.error(errMsg);
                            reject(errMsg)
                        }
                    });
            }

            indexRecord();
        })
    }

    /*
     * index saves a record to elasticsearch with a specified ID.
     * If the document is already there it will be replaced.
     */
    function indexWithId(record_id, record) {
        logger.trace(`indexWithId call with id: ${record_id}, record`, record);
        let retryTimer = {start: 5000, limit: 10000};

        return new Promise(function(resolve, reject) {
            function indexRecordID() {
                client.index({
                    index: index_name,
                    type: record_type,
                    id: record_id,
                    body: record,
                    refresh: true
                })
                    .then(function(result) {
                        resolve(record);
                    })
                    .catch(function(err) {
                        if (_.get(err, 'body.error.type') === 'es_rejected_execution_exception') {
                            let timer = Math.floor(Math.random() * (retryTimer.limit - retryTimer.start) + retryTimer.start);

                            if (retryTimer.limit < 60000) {
                                retryTimer.limit += 10000
                            }
                            if (retryTimer.start < 30000) {
                                retryTimer.start += 5000
                            }
                            setTimeout(function() {
                                indexRecordID();
                            }, timer);
                        }
                        else {
                            var errMsg = elasticError(err);
                            logger.error(`error indexWithId call with id: ${record_id}, record`, record);
                            logger.error(errMsg);
                            reject(errMsg)
                        }
                    });
            }

            indexRecordID();
        })
    }

    /*
     * Create saves a record to elasticsearch under the provided id.
     * If the record already exists it will not be inserted.
     */
    function create(record) {
        logger.trace('creating record', record);
        let retryTimer = {start: 5000, limit: 10000};

        return new Promise(function(resolve, reject) {
            function createRecord() {
                client.create({
                    index: index_name,
                    type: record_type,
                    id: record[id_field],
                    body: record,
                    refresh: true
                })
                    .then(function(result) {
                        resolve(record);
                    })
                    .catch(function(err) {
                        if (_.get(err, 'body.error.type') === 'es_rejected_execution_exception') {
                            let timer = Math.floor(Math.random() * (retryTimer.limit - retryTimer.start) + retryTimer.start);

                            if (retryTimer.limit < 60000) {
                                retryTimer.limit += 10000
                            }
                            if (retryTimer.start < 30000) {
                                retryTimer.start += 5000
                            }
                            setTimeout(function() {
                                createRecord()
                            }, timer);
                        }
                        else {
                            var errMsg = elasticError(err);
                            logger.error('error creating record', record);
                            logger.error(errMsg);
                            reject(errMsg)
                        }
                    });
            }

            createRecord();
        })
    }

    function update(record_id, update_spec) {
        logger.trace(`updating record ${record_id}, `, update_spec);
        let retryTimer = {start: 5000, limit: 10000};

        return new Promise(function(resolve, reject) {
            function updateRecord() {
                client.update({
                    index: index_name,
                    type: record_type,
                    id: record_id,
                    body: {
                        doc: update_spec
                    },
                    refresh: true,
                    retryOnConflict: 3
                })
                    .then(function(result) {
                        resolve(update_spec);
                    })
                    .catch(function(err) {
                        if (_.get(err, 'body.error.type') === 'es_rejected_execution_exception') {
                            let timer = Math.floor(Math.random() * (retryTimer.limit - retryTimer.start) + retryTimer.start);

                            if (retryTimer.limit < 60000) {
                                retryTimer.limit += 10000
                            }
                            if (retryTimer.start < 30000) {
                                retryTimer.start += 5000
                            }
                            setTimeout(function() {
                                updateRecord()
                            }, timer);
                        }
                        else {
                            var errMsg = elasticError(err);
                            logger.error(`updating record ${record_id}, `, update_spec);
                            logger.error(errMsg);
                            reject(errMsg)
                        }
                    });

            }

            updateRecord();
        })
    }

    function bulk(record, type) {
        if (!type) type = 'index';

        var indexRequest = {};
        indexRequest[type] = {
            _index: index_name,
            _type: record_type
        };

        bulkQueue.push(indexRequest);
        bulkQueue.push(record);

        // We only flush once enough records have accumulated for it to make sense.
        if (bulkQueue.length >= bulkSize) {
            logger.trace(`flushing bulk queue ${bulkQueue.length}`);
            return _flush();
        }

        // Bulk saving is a background operation so we don't have
        // anything meaningful to return.
        return Promise.resolve(true);
    }

    function remove(record_id) {
        logger.trace(`removing record ${record_id}`);
        let retryTimer = {start: 5000, limit: 10000};

        return new Promise(function(resolve, reject) {
            function removeRecord() {
                client.delete({
                    index: index_name,
                    type: record_type,
                    id: record_id,
                    refresh: true
                })
                    .then(function(result) {
                        resolve(result.found);
                    })
                    .catch(function(err) {
                        if (_.get(err, 'body.error.type') === 'es_rejected_execution_exception') {
                            let timer = Math.floor(Math.random() * (retryTimer.limit - retryTimer.start) + retryTimer.start);

                            if (retryTimer.limit < 60000) {
                                retryTimer.limit += 10000
                            }
                            if (retryTimer.start < 30000) {
                                retryTimer.start += 5000
                            }
                            setTimeout(function() {
                                removeRecord()
                            }, timer);
                        }
                        else {
                            var errMsg = elasticError(err);
                            logger.error(`error removing record ${record_id}`);
                            logger.error(errMsg);
                            reject(errMsg)
                        }
                    });
            }

            removeRecord();
        });

    }

    function shutdown() {
        return _flush();
    }

    function _flush() {

        if (bulkQueue.length > 0 && !savingBulk) {
            savingBulk = true;

            var bulkRequest = bulkQueue;
            bulkQueue = [];

            let retryTimer = {start: 5000, limit: 10000};
            var warning = warn(logger, 'The elasticsearch cluster queues are overloaded, resubmitting failed queries from bulk');

            return new Promise(function(resolve, reject) {

                function send(data) {
                    client.bulk({body: data})
                        .then(function(results) {
                            if (results.errors) {
                                var response = filterResponse(logger, data, results);

                                if (response.error) {
                                    reject(response.error)
                                }
                                else {
                                    //may get doc already created error, if so just return
                                    if (response.data.length === 0) {
                                        resolve(results)
                                    }
                                    else {
                                        let timer = Math.floor(Math.random() * (retryTimer.limit - retryTimer.start) + retryTimer.start);

                                        if (retryTimer.limit < 60000) {
                                            retryTimer.limit += 10000
                                        }
                                        if (retryTimer.start < 30000) {
                                            retryTimer.start += 5000
                                        }
                                        warning();
                                        setTimeout(function() {
                                            send(response.data)
                                        }, timer)
                                    }
                                }
                            }
                            else {
                                logger.info(`Flushed ${results.items.length} records to index ${index_name}`);
                                resolve(results)
                            }
                        })
                        .catch(function(err) {
                            var errMsg = elasticError(err);
                            logger.error(errMsg);
                            reject(errMsg)
                        })
                        .finally(function() {
                            savingBulk = false;
                        });
                }

                send(bulkRequest);
            })
        }

        return Promise.resolve(true); // nothing to be done.
    }

    function getMapFile() {
        var mappingFile = `${__dirname}/mappings/${record_type}.json`;

        return JSON.parse(fs.readFileSync(mappingFile));
    }

    function isAvailable() {
        function search() {
            return client.search({index: index_name, q: '*'})
        }

        return new Promise(function(resolve, reject) {
            search()
                .then(function(results) {
                    logger.trace(`index ${index_name} is now available`);
                    resolve(results)
                })
                .catch(function(err) {
                    var isReady = setInterval(function() {
                        search()
                            .then(function(results) {
                                clearInterval(isReady);
                                resolve(results)
                            })
                            .catch(function(err) {
                                logger.warn('verifying job index is open')
                            })
                    }, 200)
                })

        })

    }

    function _createIndex() {
        return client.indices.exists({
            index: index_name
        })
            .then(function(exists) {
                if (!exists) {
                    var mapping = getMapFile();

                    // Make sure the index exists before we do anything else.
                    return client.indices.create({
                        index: index_name,
                        body: mapping
                    })
                        .then(function(results) {
                            return results;
                        })
                        .error(function(err) {
                            // It's not really an error if it's just that the index is already there.
                            if ((err.message.indexOf('IndexAlreadyExistsException') < 0) && (err.message.indexOf('index_already_exists_exception') < 0)) {
                                var errMsg = elasticError(err);
                                logger.error(`Could not create index: ${index_name}, error: ${errMsg}`);
                                return Promise.reject(`Could not create job index, error: ${errMsg}`)
                            }
                        });
                }

                // Index already exists. nothing to do.
                return true;
            })
    }

    function refresh() {
        return client.indices.refresh({index: index_name})
    }

    // Periodically flush the bulkQueue so we don't end up with cached data lingering.
    setInterval(function() {
        _flush();
    }, 10000);

    var api = {
        get: get,
        search: search,
        refresh: refresh,
        index: index,
        indexWithId: indexWithId,
        create: create,
        update: update,
        bulk: bulk,
        remove: remove,
        shutdown: shutdown,
        count: count
    };

    return new Promise(function(resolve, reject) {
        var getClient = require('../../../utils/config.js').getClient;
        var clientName = JSON.stringify(config.state);

        client = getClient(context, config.state, 'elasticsearch');

        return _createIndex()
            .then(function(results) {
                return isAvailable();
            })
            .then(function(avaialable) {
                resolve(api);
            })
            .catch(function(err) {
                var errMsg = elasticError(err);
                logger.error(errMsg);
                logger.error(`Error created job index: ${errMsg}`);
                logger.info(`Attempting to connect to elasticsearch: ${clientName}`);

                var checking = setInterval(function() {
                    return _createIndex()
                        .then(function() {
                            return client.indices.recovery({index: index_name})
                        })
                        .then(function(results) {
                            var bool = false;

                            if (Object.keys(results).length !== 0) {
                                var isPrimary = _.filter(results[index_name].shards, function(shard) {
                                    return shard.primary === true;
                                });

                                bool = _.every(isPrimary, function(shard) {
                                    return shard.stage === "DONE"
                                });
                            }

                            if (bool) {
                                clearInterval(checking);
                                logger.info("connection to elasticsearch has been established");
                                return isAvailable().then(function(avaialble) {
                                    resolve(api);
                                })
                            }
                        })
                        .catch(function(err) {
                            var errMsg = elasticError(err);
                            logger.info(`Attempting to connect to elasticsearch: ${clientName}, error: ${errMsg}`);
                        })
                }, 3000)

            });
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
    createStore: createStore,
    reader: reader,
    oreader: oreader,
    elasticsearchVersion: elasticsearchVersion,
    autoDates: autoDates,
    queryCount: queryCount,
    putTemplate: putTemplate,
    bulkSend: bulkSend,
    nodeInfo: nodeInfo,
    nodeStats: nodeStats
};