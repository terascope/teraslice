'use strict';

var Promise = require('bluebird');
var _ = require('lodash');
var getClient = require('../utils/config').getClient;
var getOpConfig = require('../utils/config').getOpConfig;
var warn = require('../utils/elastic_utils').warn;

function newProcessor(context, opConfig, jobConfig) {
    var context = context;
    var logger;
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

    function isMeta(meta) {
        if (meta.index) return {type: 'index', realMeta: meta.index};
        if (meta.create) return {type: 'create', realMeta: meta.create};
        if (meta.update) return {type: 'update', realMeta: meta.update};
        if (meta.delete) return {type: 'delete', realMeta: meta.delete};

        return false;
    }

    function splitArray(dataArray, limit) {
        var docLimit = limit * 2;

        if (dataArray.length > docLimit) {
            var splitResults = [];

            while (dataArray.length) {
                var end = dataArray.length - 1 > docLimit ? docLimit : dataArray.length - 1;
                var isMetaData = isMeta(dataArray[end]);
                if (isMetaData && isMetaData.type !== 'delete') {
                    splitResults.push(dataArray.splice(0, end));
                }
                else {
                    splitResults.push(dataArray.splice(0, end + 1));
                }
            }

            return splitResults;
        }
        else {
            return [dataArray]
        }
    }

    function send(client, data) {
        var warning = warn(logger, 'The elasticsearch cluster queues are overloaded, resubmitting failed queries from bulk');
        var elasticsearch = require('../data_sources/elasticsearch')(client, logger, opConfig);
        return elasticsearch.bulkSend(data, warning);
    }

    function recursiveSend(client, dataArray) {
        var slicedData = splitArray(dataArray, limit);

        return Promise.map(slicedData, function(data) {
            return send(client, data)
        });
    }

    // This normalizes the top element of the record so data fields can be accessed without
    // knowing the type.
    function extractMeta(meta) {
        if (meta.index) return meta.index;
        if (meta.create) return meta.create;
        if (meta.update) return meta.update;
        if (meta.delete) return meta.delete;

        throw new Error("elasticsearch_bulk: Unknown elasticsearch operation in bulk request.")
    }

    function multiSend(data) {

        for (var i = 0; i < data.length;) {
            var meta = data[i];
            var record = null;
            // If this is a delete operation there will be no associated data record
            if (!meta.delete) {
                record = data[i + 1];
            }

            var realMeta = extractMeta(meta);

            // TODO: to really be general there will need to be some options in how keys are mapped to indices.
            if (realMeta._id) {
                var selector = realMeta._id.charAt(0);

                if (multisend_index_append) {
                    if (bulk_contexts.hasOwnProperty(selector)) {
                        realMeta._index = realMeta._index + '-' + selector;
                    }
                }
                //typically every metadata is paired with the actual data, except for delete metadata
                if (bulk_contexts.hasOwnProperty(selector)) {
                    bulk_contexts[selector].data.push(meta);

                    if (record) {
                        bulk_contexts[selector].data.push(record);
                    }
                }
                else if (bulk_contexts.hasOwnProperty('*')) {
                    bulk_contexts['*'].data.push(meta);

                    if (record) {
                        bulk_contexts['*'].data.push(record);
                    }
                }
                else {
                    logger.error("elasticsearch_bulk: invalid connection selector extracted from key: " + _id);
                }
            }
            else {
                throw new Error("elasticsearch_bulk: multisend is set but records do not have _id in the bulk request input.");
            }

            i += 1; // skip over the metadata
            if (record) i += 1; // And if there is a data record then skip again.
        }

        var senders = [];
        for (var key in bulk_contexts) {
            if (bulk_contexts[key].data.length > 0) {
                senders.push(recursiveSend(bulk_contexts[key].connection, bulk_contexts[key].data));
            }
        }

        return Promise.all(senders).then(results => _.flatten(results));
    }


    return function(data, logger_in) {
        logger = logger_in;

        //bulk throws an error if you send an empty array
        if (data === undefined || data.length === 0) {
            return Promise.resolve(data);
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
