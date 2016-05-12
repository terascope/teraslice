'use strict';

// Cache of recently requested records, keyed by record_id
//var recordCache = {};

var uuid = require('uuid');
var Promise = require('bluebird');
var _ = require('lodash');
var fs = require('fs');

// Module to manage persistence in Elasticsearch.
// All functions in this module return promises that must be resolved to
// get the final result.
module.exports = function(context, index_name, record_type, id_field, bulk_size) {
    var logger = context.logger;
    var config = context.sysconfig.teraslice;

    var client;

    // Buffer to build up bulk requests.
    var bulkQueue = [];
    var savingBulk = false; // serialize save requests.

    var bulkSize = 500;
    if (bulk_size) bulkSize = bulk_size;

    function get(record_id) {
        return client.get({
            index: index_name,
            type: record_type,
            id: record_id
        }).then(function(result) {
            return result._source
        });
    }

    function search(query, from, size, sort) {
        return client.search({
            index: index_name,
            q: query,
            from: from,
            size: size,
            sort: sort
        }).then(function(results) {
            return _.map(results.hits.hits, function(hit) {
                return hit._source
            });
        })
    }

    function count(query, from, sort) {
        return client.search({
            index: index_name,
            q: query,
            from: from,
            sort: sort
        }).then(function(results) {
            return results.hits.total;
        })
    }

    /*
     * index saves a record to elasticsearch allowing automatic
     * ID creattion
     */
    function index(record) {

        return client.index({
            index: index_name,
            type: record_type,
            body: record,
            refresh: true
        }).then(function(result) {
            return record;
        });
    }

    /*
     * index saves a record to elasticsearch with a specified ID.
     * If the document is already there it will be replaced.
     */
    function indexWithId(record_id, record) {

        return client.index({
            index: index_name,
            type: record_type,
            id: record_id,
            body: record,
            refresh: true
        }).then(function(result) {
            return record;
        });
    }

    /*
     * Create saves a record to elasticsearch under the provided id.
     * If the record already exists it will not be inserted.
     */
    function create(record) {

        return client.create({
            index: index_name,
            type: record_type,
            id: record[id_field],
            body: record,
            refresh: true
        }).then(function(result) {
            return record;
        });
    }

    function update(record_id, update_spec) {

        return client.update({
            index: index_name,
            type: record_type,
            id: record_id,
            body: {
                doc: update_spec
            },
            refresh: true
        }).then(function(result) {
            return update_spec;
        });
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
        if (bulkQueue.length >= bulkSize) _flush();

        // Bulk saving is a background operation so we don't have
        // anything meaningful to return.
        return Promise.resolve(true);
    }

    function remove(record_id) {
        return client.delete({
            index: index_name,
            type: record_type,
            id: record_id,
            refresh: true
        }).then(function(result) {
            return result.found;
        });
    }

    function shutdown() {
        logger.info("ElasticsearchStorageBackend: shutting down.")
        return _flush();
    }

    function _flush() {
        if (bulkQueue.length > 0 && !savingBulk) {
            savingBulk = true;
            var bulkRequest = bulkQueue;
            bulkQueue = [];

            return client.bulk({
                body: bulkRequest
            })
                .then(function(results) {
                    logger.info("Flushed " + results.items.length + " records to index " + index_name);
                })
                .catch(function(err) {
                    // TODO: some of these requests will be quite important.
                    // For certain errors the real error may be buried in the response
                    // to the bulk request so that may need special handling.
                    logger.error(err);
                })
                .finally(function() {
                    savingBulk = false;
                });
        }

        return Promise.resolve(true); // nothing to be done.
    }

    function _createIndex() {
        return client.indices.exists({
            index: index_name
        })
            .then(function(exists) {
                if (!exists) {
                    var mappingFile = __dirname + '/mappings/' + record_type + '.json';

                    var mapping = JSON.parse(fs.readFileSync(mappingFile));

                    // Make sure the index exists before we do anything else.
                    return client.indices.create({
                        index: index_name,
                        body: mapping
                    })
                        .error(function(err) {
                            // It's not really an error if it's just that the index is already there.
                            if ((err.message.indexOf('IndexAlreadyExistsException') < 0) && (err.message.indexOf('index_already_exists_exception') < 0)) {
                                logger.error("ElasticsearchStorageBackend: Could not create index: " + index_name + " " + err);
                            }
                        });
                }

                // Index already exists. nothing to do.
                return Promise.resolve(true);
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
        var clientName = JSON.stringify(config.cluster.state);

        client = getClient(context, config.cluster.state, 'elasticsearch');

        return _createIndex()
            .then(function() {
                resolve(api);
            })
            .catch(function(err){
                logger.error("Error created job index: "+ err.message);
                logger.info("Attempting to connect to elasticsearch: " + clientName);

                var checking = setInterval(function(){
                    return _createIndex()
                        .then(function() {
                            clearInterval(checking);
                            logger.info("connection to elasticsearch has been established");
                            resolve(api);
                        })
                        .catch(function(err){
                            logger.info("Attempting to connect to elasticsearch: " + clientName);
                        })
                }, 3000)

            });
    });
};