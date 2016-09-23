'use strict';

var uuid = require('uuid');
var Promise = require('bluebird');
var _ = require('lodash');
var fs = require('fs');
var filterResponse = require('../../../utils/elastic_utils').filterResponse;
var warn = require('../../../utils/elastic_utils').warn;
var elasticError = require('../../../utils/error_utils').elasticError;


// Module to manage persistence in Elasticsearch.
// All functions in this module return promises that must be resolved to get the final result.
module.exports = function(context, index_name, record_type, id_field, bulk_size) {
    var logger = context.foundation.makeLogger('backend_elasticsearch', 'backend_elasticsearch', {backend: 'elasticsearch'});
    var config = context.sysconfig.teraslice;

    var client;

    // Buffer to build up bulk requests.
    var bulkQueue = [];
    var savingBulk = false; // serialize save requests.

    var bulkSize = 500;
    if (bulk_size) bulkSize = bulk_size;

    function get(record_id) {
        return new Promise(function(resolve, reject) {
            client.get({
                index: index_name,
                type: record_type,
                id: record_id
            }).then(function(result) {
                resolve(result._source)
            }).catch(function(err) {
                if (err.body.error && err.body.error.type === 'es_rejected_execution_exception') {
                    get(record_id)
                }
                else {
                    var errMsg = elasticError(err);
                    reject(errMsg)
                }
            });
        })

    }

    function search(query, from, size, sort) {
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
                            // Spot to recurse in the future, will reject for now
                            var errorReason = reasons.join(' | ');
                            logger.error(errorReason);
                            reject(errorReason)
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
                    logger.error(errMsg);
                    reject(errMsg)
                });
        });
    }

    function count(query, from, sort) {
        var esQuery = {
            index: index_name,
            from: from,
            size: 0,
            sort: sort
        };

        if (typeof query === 'string') {
            esQuery.q = query
        }
        else {
            esQuery.body = query
        }

        return new Promise(function(resolve, reject) {
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
                            // Spot to recurse in the future, will reject for now
                            var errorReason = reasons.join(' | ');
                            logger.error(errorReason);
                            reject(errorReason)
                        }
                    }
                    else {
                        resolve(results.hits.total)
                    }
                })
                .catch(function(err) {
                    if (err.body.error.type === 'reduce_search_phase_exception') {
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
                        logger.error(errMsg);
                        reject(errMsg)
                    }
                });
        });
    }

    /*
     * index saves a record to elasticsearch allowing automatic
     * ID creattion
     */
    function index(record) {
        return new Promise(function(resolve, reject) {
            client.index({
                index: index_name,
                type: record_type,
                body: record,
                refresh: true
            }).then(function(result) {
                resolve(record);
            }).catch(function(err) {
                if (err.body.error.type === 'es_rejected_execution_exception') {
                    index(record)
                }
                else {
                    var errMsg = elasticError(err);
                    logger.error(errMsg);
                    reject(errMsg)
                }
            });
        })
    }

    /*
     * index saves a record to elasticsearch with a specified ID.
     * If the document is already there it will be replaced.
     */
    function indexWithId(record_id, record) {
        return new Promise(function(resolve, reject) {
            client.index({
                index: index_name,
                type: record_type,
                id: record_id,
                body: record,
                refresh: true
            }).then(function(result) {
                resolve(record);
            }).catch(function(err) {
                if (err.body.error.type === 'es_rejected_execution_exception') {
                    indexWithId(record_id, record)
                }
                else {
                    var errMsg = elasticError(err);
                    logger.error(errMsg);
                    reject(errMsg)
                }
            });
        })
    }

    /*
     * Create saves a record to elasticsearch under the provided id.
     * If the record already exists it will not be inserted.
     */
    function create(record) {
        return new Promise(function(resolve, reject) {
            client.create({
                index: index_name,
                type: record_type,
                id: record[id_field],
                body: record,
                refresh: true
            }).then(function(result) {
                resolve(record);
            }).catch(function(err) {
                if (err.body.error.type === 'es_rejected_execution_exception') {
                    create(record)
                }
                else {
                    var errMsg = elasticError(err);
                    logger.error(errMsg);
                    reject(errMsg)
                }
            });
        })
    }

    function update(record_id, update_spec) {
        return new Promise(function(resolve, reject) {
            client.update({
                index: index_name,
                type: record_type,
                id: record_id,
                body: {
                    doc: update_spec
                },
                refresh: true
            }).then(function(result) {
                resolve(update_spec);
            }).catch(function(err) {
                if (err.body.error.type === 'es_rejected_execution_exception') {
                    console.log('am i getting into the update recursion?');
                    update(record_id, update_spec)
                }
                else {
                    var errMsg = elasticError(err);
                    logger.error(errMsg);
                    reject(errMsg)
                }
            });
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
            return _flush();
        }

        // Bulk saving is a background operation so we don't have
        // anything meaningful to return.
        return Promise.resolve(true);
    }

    function remove(record_id) {
        return new Promise(function(resolve, reject) {
            client.delete({
                index: index_name,
                type: record_type,
                id: record_id,
                refresh: true
            }).then(function(result) {
                resolve(result.found);
            }).catch(function(err) {
                if (err.body.error.type === 'es_rejected_execution_exception') {
                    remove(record_id)
                }
                else {
                    var errMsg = elasticError(err);
                    logger.error(errMsg);
                    reject(errMsg)
                }
            });
        });
    }

    function shutdown() {
        logger.info("ElasticsearchStorageBackend: shutting down.");
        return _flush();
    }

    function _flush() {

        if (bulkQueue.length > 0 && !savingBulk) {
            savingBulk = true;
            var bulkRequest = bulkQueue;
            bulkQueue = [];

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
                                    warning();
                                    return send(response.data)
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
                    }).then(function(results) {
                        return results;
                    })
                        .error(function(err) {
                            // It's not really an error if it's just that the index is already there.
                            if ((err.message.indexOf('IndexAlreadyExistsException') < 0) && (err.message.indexOf('index_already_exists_exception') < 0)) {
                                var errMsg = elasticError(err);
                                logger.error(`ElasticsearchStorageBackend: Could not create index: ${index_name}, error: ${errMsg}`);
                                return Promise.reject(`Could not create job index, error: ${errMsg}`)
                            }
                        });
                }

                // Index already exists. nothing to do.
                return true;
            })
    }

    // Periodically flush the bulkQueue so we don't end up with cached data lingering.
    setInterval(function() {
        _flush();
    }, 10000);

    var api = {
        get: get,
        search: search,
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
                            var isPrimary = _.filter(results[index_name].shards, function(shard) {
                                return shard.primary === true;
                            });

                            var bool = _.every(isPrimary, function(shard) {
                                return shard.stage === "DONE"
                            });

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
};