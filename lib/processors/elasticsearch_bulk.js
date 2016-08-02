'use strict';

var Promise = require('bluebird');
var _ = require('lodash');
var getClient = require('../utils/config').getClient;
var getOpConfig = require('../utils/config').getOpConfig;
var filterResponse = require('../utils/elastic_utils').filterResponse;
var warn = require('../utils/elastic_utils').warn;

function newProcessor(context, opConfig, jobConfig) {
    var context = context;
    var logger = jobConfig.logger;
    var opConfig = opConfig;
    var limit = opConfig.size;
    var client;

    var bulk_contexts = {};
    var multisend = opConfig.multisend;
    var multisend_index_append = opConfig.multisend_index_append;

    var connection_map = opConfig.connection_map;

    if (multisend) {
        _initializeContexts();
    }
    else {
        client = getClient(context, opConfig, 'elasticsearch');
    }

    function _initializeContexts() {
        // We create a bulk context for each keyset then map individual keys
        // to the bulk context for their keyset.
        for (var keyset in connection_map) {
            multisend = true;
            // All the keys in the map share the same connection and bulk context.
            var connection = getClient(context, {connection: connection_map[keyset]}, 'elasticsearch');
            var data = [];

            var keys = keyset.split(',');
            for (var i = 0; i < keys.length; i++) {

                bulk_contexts[keys[i].toLowerCase()] = {
                    connection: connection,
                    data: data
                };
            }
        }
    }

    /*
     * Chunk the result array into reasonably sized chunks and send as
     * individual bulk requests.
     */
    function recursiveSend(client, dataArray) {
        var fnArray = [];
        var warning = warn(logger, 'The elasticsearch cluster queues are overloaded, resubmitting failed queries from bulk');

        while (dataArray.length) {
            var end = dataArray.length > limit ? limit : dataArray.length;
            var slicedData = dataArray.splice(0, end);
            var sendFn = new Promise(function(resolve, reject) {

                function send(data) {
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
                                        return send(response.data)
                                    }
                                }
                            }
                            else {
                                resolve(results)
                            }
                        })
                        .catch(function(err) {
                            reject(err.message)
                        })
                }

                send(slicedData)
            });

            fnArray.push(sendFn)
        }

        return Promise.all(fnArray);
    }

    function extractMeta(meta) {
        if (meta.index) return meta.index;
        if (meta.create) return meta.create;
        if (meta.update) return meta.update;
        if (meta.delete) return meta.delete;

        throw new Error("elasticsearch_bulk: Unknown elasticsearch operation in bulk request.")
    }

    function multiSend(data) {
        // Map data to connections then bulk send across all connections.
        // The incoming data needs to already be in ES bulk format so there are
        // two entries for each record.
        for (var i = 0; i < data.length;) {
            var meta = data[i];
            var record = data[i + 1];

            // The incoming stream could contain various operations.
            var realMeta = extractMeta(meta);

            var _id = realMeta._id;

            // TODO: to really be general there will need to be some options
            // in how keys are mapped to indices.
            if (_id) {
                var selector = _id.charAt(0);

                if (multisend_index_append) {
                    if (bulk_contexts.hasOwnProperty(selector)) {
                        realMeta._index = realMeta._index + '-' + selector;
                    }
                }

                if (bulk_contexts.hasOwnProperty(selector)) {
                    bulk_contexts[selector].data.push(meta);
                    bulk_contexts[selector].data.push(record);
                }
                else if (bulk_contexts.hasOwnProperty('*')) {
                    bulk_contexts['*'].data.push(meta);
                    bulk_contexts['*'].data.push(record);
                }
                else {
                    logger.error("elasticsearch_bulk: invalid connection selector extracted from key: " + _id);
                }
            }
            else {
                throw new Error("elasticsearch_bulk: multisend is set but records do not have _id in the bulk request input.");
            }

            i += 2;
        }

        var senders = [];
        for (var key in bulk_contexts) {
            senders.push(recursiveSend(bulk_contexts[key].connection, bulk_contexts[key].data));
        }

        return senders;
    }


    return function(data) {
        //bulk throws an error if you send an empty array
        if (data === undefined || data.length === 0) {
            return Promise.resolve(0);
        }

        if (multisend) {
            return multiSend(data);
        }
        else {
            return recursiveSend(client, data);
        }
    }
}

function schema() {
    // No schema specified, this just needs elasticsearch_index_selector to be properly configured
    // as well as the correct client from system config
    return {
        size: {
            doc: 'the maximum number of docs it will take at a time, anything past it will be split up and sent' +
            'note that the value should be even, the first doc will be the index data and then the next is the data',
            default: 500,
            format: function(val) {
                if (isNaN(val)) {
                    throw new Error('size parameter for elasticsearch_bulk must be a number')
                }
                else {
                    if (val <= 0) {
                        throw new Error('size parameter for elasticsearch_bulk must be greater than zero')
                    }
                    if (val % 2 !== 0) {
                        throw new Error('size on elasticsearch_bulk must be an even number')
                    }
                }
            }
        },
        connection_map: {
            doc: 'Mapping from ID prefix to connection names. Routes data to multiple clusters ' +
            'based on the incoming key. Used when multisend is set to true. The key name can be a ' +
            'comma separated list of prefixes that will map to the same connection. Prefixes matching takes ' +
            'the first character of the key.',
            default: {
                '*': 'default'
            },
            format: Object
        },
        multisend: {
            doc: 'When set to true the connection_map will be used allocate the data stream across multiple ' +
            'connections based on the keys of the incoming documents.',
            default: false,
            format: Boolean
        },
        multisend_index_append: {
            doc: 'When set to true will append the connection_map prefixes to the name of the index ' +
            'before data is submitted.',
            default: false,
            format: Boolean
        },
        connection: {
            doc: 'Name of the elasticsearch connection to use when sending data.',
            default: 'default',
            format: 'optional_String'
        }
    };
}

function post_validation(job, sysconfig) {
    var opConfig = getOpConfig(job, 'elasticsearch_bulk');
    var elasticConnectors = sysconfig.terafoundation.connectors.elasticsearch;
    
    //check to verify if connection map provided is consistent with sysconfig.terafoundation.connectors
    _.forOwn(opConfig.connection_map, function(value, key) {
        if (!elasticConnectors[value]) {
            throw new Error(`elasticsearch_bulk connection_map specifies a connection for [${value}] but is not found in the system configuration [terafoundation.connectors.elasticsearch]`)
        }
    })
}

module.exports = {
    newProcessor: newProcessor,
    post_validation: post_validation,
    schema: schema
};
