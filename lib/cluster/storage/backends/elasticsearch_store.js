'use strict';

var fs = require('fs');
var _ = require('lodash');

var filterResponse = require('../../../utils/elastic_utils').filterResponse;
var elasticError = require('../../../utils/error_utils').elasticError;
var warn = require('../../../utils/elastic_utils').warn;
var get = require('./elasticsearch').get;
var index = require('./elasticsearch').index;
var indexWithId = require('./elasticsearch').indexWithId;
var create = require('./elasticsearch').create;
var update = require('./elasticsearch').update;
var remove = require('./elasticsearch').remove;
var search = require('./elasticsearch').search;

module.exports = function(context, index_name, record_type, id_field, bulk_size) {
    var logger = context.foundation.makeLogger('elasticsearch_backend', 'elasticsearch_backend', {module: 'elasticsearch_backend'});
    var config = context.sysconfig.teraslice;

    var client;

    // Buffer to build up bulk requests.
    var bulkQueue = [];
    var savingBulk = false; // serialize save requests.

    var bulkSize = 500;
    if (bulk_size) bulkSize = bulk_size;

    function esGet(record_id) {
        logger.trace(`getting record id: ${record_id}`);
        let query = {
            index: index_name,
            type: record_type,
            id: record_id
        };

        return get(client, null, query, logger)
    }

    function esSearch(query, from, size, sort) {
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

        return search(client, null, esQuery, logger)
    }

    /*
     * index saves a record to elasticsearch allowing automatic
     * ID creation
     */
    function esIndex(record) {
        logger.trace(`indexing record`, record);
        let query = {
            index: index_name,
            type: record_type,
            body: record,
            refresh: true
        };

        return index(client, null, query, logger)
    }

    /*
     * index saves a record to elasticsearch with a specified ID.
     * If the document is already there it will be replaced.
     */
    function esIndexWithId(record_id, record) {
        logger.trace(`indexWithId call with id: ${record_id}, record`, record);
        let query = {
            index: index_name,
            type: record_type,
            id: record_id,
            body: record,
            refresh: true
        };

        return indexWithId(client, null, query, logger);
    }

    /*
     * Create saves a record to elasticsearch under the provided id.
     * If the record already exists it will not be inserted.
     */
    function esCreate(record) {
        logger.trace('creating record', record);

        let query = {
            index: index_name,
            type: record_type,
            id: record[id_field],
            body: record,
            refresh: true
        };

        return create(client, null, query, logger);
    }

    function esCount(query, from, sort) {
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

        return search(client, null, esQuery, logger)
    }

    function esUpdate(record_id, update_spec) {
        logger.trace(`updating record ${record_id}, `, update_spec);

        let query = {
            index: index_name,
            type: record_type,
            id: record_id,
            body: {
                doc: update_spec
            },
            refresh: true,
            retryOnConflict: 3
        };

        return update(client, null, query, logger)
    }

    function esRemove(record_id) {
        logger.trace(`removing record ${record_id}`);
        let query = {
            index: index_name,
            type: record_type,
            id: record_id,
            refresh: true
        };

        return remove(client, null, query, logger)
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
        get: esGet,
        search: esSearch,
        refresh: refresh,
        index: esIndex,
        indexWithId: esIndexWithId,
        create: esCreate,
        update: esUpdate,
        bulk: bulk,
        remove: esRemove,
        shutdown: shutdown,
        count: esCount
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
};
