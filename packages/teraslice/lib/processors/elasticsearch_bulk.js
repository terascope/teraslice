'use strict';

const Promise = require('bluebird');
const _ = require('lodash');
const util = require('util');
const { getOpConfig, getClient } = require('@terascope/teraslice-operations');

function newProcessor(context, opConfig) {
    let logger;
    const limit = opConfig.size;
    let client;
    const bulkContexts = {};
    let { multisend } = opConfig;
    const multisendIndexAppend = opConfig.multisend_index_append;

    const connectionMap = opConfig.connection_map;

    if (multisend) {
        _initializeContexts();
    } else {
        client = getClient(context, opConfig, 'elasticsearch');
    }

    function _initializeContexts() {
        // We create a bulk context for each keyset then map individual keys
        // to the bulk context for their keyset.
        _.forEach(_.keys(connectionMap), (keyset) => {
            multisend = true;
            // All the keys in the map share the same connection and bulk context.
            const connection = getClient(context, { connection: connectionMap[keyset] }, 'elasticsearch');
            const data = [];

            const keys = keyset.split(',');
            for (let i = 0; i < keys.length; i += 1) {
                bulkContexts[keys[i].toLowerCase()] = {
                    connection,
                    data
                };
            }
        });
    }

    function isMeta(meta) {
        if (meta.index) return { type: 'index', realMeta: meta.index };
        if (meta.create) return { type: 'create', realMeta: meta.create };
        if (meta.update) return { type: 'update', realMeta: meta.update };
        if (meta.delete) return { type: 'delete', realMeta: meta.delete };

        return false;
    }

    function splitArray(dataArray, splitLimit) {
        const docLimit = splitLimit * 2;

        if (dataArray.length > docLimit) {
            const splitResults = [];

            while (dataArray.length) {
                const end = dataArray.length - 1 > docLimit ? docLimit : dataArray.length - 1;
                const isMetaData = isMeta(dataArray[end]);
                if (isMetaData && isMetaData.type !== 'delete') {
                    splitResults.push(dataArray.splice(0, end));
                } else {
                    splitResults.push(dataArray.splice(0, end + 1));
                }
            }

            return splitResults;
        }

        return [dataArray];
    }

    function send(_client, data) {
        const elasticsearch = require('@terascope/elasticsearch-api')(_client, logger, opConfig);
        return elasticsearch.bulkSend(data);
    }

    function recursiveSend(_client, dataArray) {
        const slicedData = splitArray(dataArray, limit);

        return Promise.map(slicedData, data => send(_client, data));
    }

    // This normalizes the top element of the record so data fields can be accessed without
    // knowing the type.
    function extractMeta(meta) {
        if (meta.index) return meta.index;
        if (meta.create) return meta.create;
        if (meta.update) return meta.update;
        if (meta.delete) return meta.delete;

        throw new Error('elasticsearch_bulk: Unknown elasticsearch operation in bulk request.');
    }

    function multiSend(data) {
        for (let i = 0; i < data.length;) {
            const meta = data[i];
            let record = null;
            // If this is a delete operation there will be no associated data record
            if (!meta.delete) {
                record = data[i + 1];
            }

            const realMeta = extractMeta(meta);

            // TODO: to really be general there will need to be some options
            // in how keys are mapped to indices.
            if (realMeta._id) {
                const selector = realMeta._id.charAt(0);

                if (multisendIndexAppend) {
                    if (_.has(bulkContexts, selector)) {
                        realMeta._index = `${realMeta._index}-${selector}`;
                    }
                }
                // typically every metadata is paired with the actual data,
                //   except for delete metadata
                if (_.has(bulkContexts, selector)) {
                    bulkContexts[selector].data.push(meta);

                    if (record) {
                        bulkContexts[selector].data.push(record);
                    }
                } else if (_.has(bulkContexts, '*')) {
                    bulkContexts['*'].data.push(meta);

                    if (record) {
                        bulkContexts['*'].data.push(record);
                    }
                } else {
                    logger.error(`elasticsearch_bulk: invalid connection selector extracted from key: ${realMeta._id}`);
                }
            } else {
                throw new Error('elasticsearch_bulk: multisend is set but records do not have _id in the bulk request input.');
            }

            i += 1; // skip over the metadata
            if (record) i += 1; // And if there is a data record then skip again.
        }

        const senders = [];
        _.forEach(_.keys(bulkContexts), (key) => {
            if (bulkContexts[key].data.length > 0) {
                senders.push(recursiveSend(bulkContexts[key].connection, bulkContexts[key].data));
            }
        });

        return Promise.all(senders).then(results => _.flatten(results));
    }


    return function _elasticsearchBulkFn(data, loggerIn) {
        logger = loggerIn;

        // bulk throws an error if you send an empty array
        if (data === undefined || data.length === 0) {
            return Promise.resolve(data);
        }

        if (multisend) {
            return multiSend(data);
        }

        return recursiveSend(client, data);
    };
}

function schema() {
    // No schema specified, this just needs elasticsearch_index_selector to be properly configured
    // as well as the correct client from system config
    return {
        size: {
            doc: 'the maximum number of docs it will take at a time, anything past it will be split up and sent'
            + 'note that the value should be even, the first doc will be the index data and then the next is the data',
            default: 500,
            format(val) {
                if (isNaN(val)) {
                    throw new Error('size parameter for elasticsearch_bulk must be a number');
                } else if (val <= 0) {
                    throw new Error('size parameter for elasticsearch_bulk must be greater than zero');
                }
            }
        },
        connection_map: {
            doc: 'Mapping from ID prefix to connection names. Routes data to multiple clusters '
            + 'based on the incoming key. Used when multisend is set to true. The key name can be a '
            + 'comma separated list of prefixes that will map to the same connection. Prefixes matching takes '
            + 'the first character of the key.',
            default: {
                '*': 'default'
            },
            format: Object
        },
        multisend: {
            doc: 'When set to true the connection_map will be used allocate the data stream across multiple '
            + 'connections based on the keys of the incoming documents.',
            default: false,
            format: Boolean
        },
        multisend_index_append: {
            doc: 'When set to true will append the connection_map prefixes to the name of the index '
            + 'before data is submitted.',
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

function crossValidation(job, sysconfig) {
    const opConfig = getOpConfig(job, 'elasticsearch_bulk');
    const elasticConnectors = sysconfig.terafoundation.connectors.elasticsearch;

    // check to verify if connection map provided is
    //   consistent with sysconfig.terafoundation.connectors
    if (opConfig.multisend) {
        _.forOwn(opConfig.connection_map, (value) => {
            if (!elasticConnectors[value]) {
                throw new Error(`elasticsearch_bulk connection_map specifies a connection for [${value}] but is not found in the system configuration [terafoundation.connectors.elasticsearch]`);
            }
        });
    }
}

const depMsg = 'This native processors in teraslice are being deprecated, please use the elasticsearch-assets project with the assets api to use this module';
const code = 'esReader';

module.exports = {
    newProcessor: util.deprecate(newProcessor, depMsg, code),
    schema: util.deprecate(schema, depMsg, code),
    crossValidation: util.deprecate(crossValidation, depMsg, code)
};
