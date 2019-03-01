'use strict';

const fs = require('fs');
const _ = require('lodash');
const { TSError, parseError } = require('@terascope/utils');
const elasticsearchApi = require('@terascope/elasticsearch-api');
const { getClient } = require('@terascope/job-components');
const { timeseriesIndex } = require('../../../utils/date_utils');

// eslint-disable-next-line max-len
module.exports = function module(backendConfig) {
    const {
        context,
        indexName,
        recordType,
        idField,
        bulkSize = 500,
        fullResponse = false,
        logRecord = true,
        forceRefresh = true
    } = backendConfig;

    const logger = context.apis.foundation.makeLogger({
        module: 'elasticsearch_backend',
        storageType: recordType,
    });

    const config = context.sysconfig.teraslice;
    let elasticsearch;
    let client;
    let flushInterval;
    let isShutdown = false;

    // Buffer to build up bulk requests.
    let bulkQueue = [];
    let savingBulk = false; // serialize save requests.

    function getRecord(recordId, indexArg, fields) {
        logger.trace(`getting record id: ${recordId}`);
        const query = {
            index: indexArg || indexName,
            type: recordType,
            id: recordId
        };

        if (fields) {
            query._source = fields;
        }
        return elasticsearch.get(query);
    }

    function search(query, from, size, sort, fields, indexArg) {
        const esQuery = {
            index: indexArg || indexName,
            from,
            size,
            sort
        };

        if (typeof query === 'string') {
            esQuery.q = query;
        } else {
            esQuery.body = query;
        }

        if (fields) {
            esQuery._source = fields;
        }

        return elasticsearch.search(esQuery);
    }

    /*
     * index saves a record to elasticsearch allowing automatic
     * ID creation
     */
    function index(record, indexArg) {
        logger.trace('indexing record', logRecord ? record : null);
        const query = {
            index: indexArg || indexName,
            type: recordType,
            body: record,
            refresh: forceRefresh
        };

        return elasticsearch.index(query);
    }

    /*
     * index saves a record to elasticsearch with a specified ID.
     * If the document is already there it will be replaced.
     */
    function indexWithId(recordId, record, indexArg) {
        logger.trace(`indexWithId call with id: ${recordId}, record`, logRecord ? record : null);
        const query = {
            index: indexArg || indexName,
            type: recordType,
            id: recordId,
            body: record,
            refresh: forceRefresh
        };

        return elasticsearch.indexWithId(query);
    }

    /*
     * Create saves a record to elasticsearch under the provided id.
     * If the record already exists it will not be inserted.
     */
    function create(record, indexArg) {
        logger.trace('creating record', logRecord ? record : null);

        const query = {
            index: indexArg || indexName,
            type: recordType,
            id: record[idField],
            body: record,
            refresh: forceRefresh
        };

        return elasticsearch.create(query);
    }

    function count(query, from, sort, indexArg) {
        const esQuery = {
            index: indexArg || indexName,
            from,
            sort
        };

        if (typeof query === 'string') {
            esQuery.q = query;
        } else {
            esQuery.body = query;
        }

        return elasticsearch.count(esQuery);
    }

    function update(recordId, updateSpec, indexArg) {
        logger.trace(`updating record ${recordId}, `, logRecord ? updateSpec : null);

        const query = {
            index: indexArg || indexName,
            type: recordType,
            id: recordId,
            body: {
                doc: updateSpec
            },
            refresh: forceRefresh,
            retryOnConflict: 3
        };

        return elasticsearch.update(query);
    }

    function remove(recordId, indexArg) {
        logger.trace(`removing record ${recordId}`);
        const query = {
            index: indexArg || indexName,
            type: recordType,
            id: recordId,
            refresh: forceRefresh
        };

        return elasticsearch.remove(query);
    }

    function bulk(record, _type, indexArg) {
        let type = _type;
        if (!type) {
            type = 'index';
        }

        const indexRequest = {};
        indexRequest[type] = {
            _index: indexArg || indexName,
            _type: recordType
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

    function shutdown(forceShutdown) {
        const startTime = Date.now();
        clearInterval(flushInterval);
        if (forceShutdown !== true) {
            return _flush();
        }

        return new Promise((resolve, reject) => {
            logger.trace(`attempting to shutdown, will destroy in ${config.shutdown_timeout}`);
            const timeout = setTimeout(_destroy, config.shutdown_timeout).unref();

            function _destroy(err) {
                logger.trace(`shutdown store, took ${Date.now() - startTime}ms`);

                bulkQueue.length = [];
                isShutdown = true;
                clearTimeout(timeout);

                if (err) reject(err);
                else resolve();
            }

            _flush()
                .then(() => {
                    _destroy();
                })
                .catch((err) => {
                    _destroy(err);
                });
        });
    }

    function _flush() {
        if (bulkQueue.length > 0 && !savingBulk) {
            savingBulk = true;

            const bulkRequest = bulkQueue;
            bulkQueue = [];

            return elasticsearch.bulkSend(bulkRequest)
                .then((results) => {
                    logger.debug(`Flushed ${results.items.length} records to index ${indexName}`);
                })
                .catch((err) => {
                    const error = new TSError(err, {
                        reason: `Failure to flush "${recordType}"`
                    });
                    return Promise.reject(error);
                })
                .finally(() => {
                    savingBulk = false;
                });
        }

        return Promise.resolve(true); // nothing to be done.
    }

    function getMapFile() {
        const mappingFile = `${__dirname}/mappings/${recordType}.json`;

        return JSON.parse(fs.readFileSync(mappingFile));
    }

    function isAvailable(indexArg) {
        const query = { index: indexArg || indexName, q: '*' };

        return new Promise(((resolve) => {
            elasticsearch.search(query)
                .then((results) => {
                    logger.trace(`index ${indexName} is now available`);
                    resolve(results);
                })
                .catch(() => {
                    const isReady = setInterval(() => {
                        if (isShutdown) {
                            clearInterval(isReady);
                            return;
                        }

                        elasticsearch.search(query)
                            .then((results) => {
                                clearInterval(isReady);
                                resolve(results);
                            })
                            .catch(() => {
                                logger.warn('verifying job index is open');
                            });
                    }, 200);
                });
        }));
    }

    function sendTemplate(mapping) {
        if (mapping.template) {
            const clusterName = context.sysconfig.teraslice.name;
            const name = `${clusterName}_${recordType}_template`;
            // setting template name to reflect current teraslice instance name to help prevent
            // conflicts with differing versions of teraslice with same elastic db
            if (mapping.template) {
                if (!mapping.template.match(clusterName)) {
                    mapping.template = `${clusterName}${mapping.template}`;
                }
            }

            return putTemplate(mapping, name);
        }

        return Promise.resolve(true);
    }

    function _createIndex(indexArg) {
        const existQuery = { index: indexArg || indexName };
        return elasticsearch.index_exists(existQuery)
            .then((exists) => {
                if (!exists) {
                    const mapping = getMapFile();

                    // Make sure the index exists before we do anything else.
                    const createQuery = {
                        index: indexArg || indexName,
                        body: mapping
                    };

                    return sendTemplate(mapping)
                        .then(() => elasticsearch.index_create(createQuery))
                        .then(results => results)
                        .catch((err) => {
                            // It's not really an error if it's just that the index is already there
                            if (parseError(err).match(/index_already_exists_exception/)) {
                                return true;
                            }

                            const error = new TSError(err, {
                                reason: `Could not create index: ${indexName}`
                            });
                            return Promise.reject(error);
                        });
                }

                // Index already exists. nothing to do.
                return true;
            });
    }

    function refresh(indexArg) {
        const query = { index: indexArg || indexName };
        return elasticsearch.index_refresh(query);
    }

    function putTemplate(template, name) {
        return elasticsearch.putTemplate(template, name);
    }

    // Periodically flush the bulkQueue so we don't end up with cached data lingering.
    flushInterval = setInterval(() => {
        _flush().catch((err) => {
            logger.error(err, 'background flush failure');
            return null;
        });
    }, 10000);

    // javascript is having a fit if you use the shorthand get, so we renamed function to getRecord
    const api = {
        get: getRecord,
        search,
        refresh,
        index,
        indexWithId,
        create,
        update,
        bulk,
        remove,
        shutdown,
        count,
        putTemplate
    };

    const isMultiIndex = indexName[indexName.length - 1] === '*';
    let newIndex = indexName;

    if (isMultiIndex) {
        const storeType = indexName.match(/__(.*)\*/)[1];
        const timeseriesFormat = config.index_rollover_frequency[storeType];
        const nameSize = indexName.length - 1;
        newIndex = timeseriesIndex(timeseriesFormat, indexName.slice(0, nameSize)).index;
    }

    return new Promise(((resolve) => {
        const clientName = JSON.stringify(config.state);
        client = getClient(context, config.state, 'elasticsearch');

        let { connection } = config.state;
        if (config.state.endpoint) {
            connection += `:${config.state.endpoint}`;
        }

        const options = {
            full_response: !!fullResponse,
            connection,
        };

        elasticsearch = elasticsearchApi(client, logger, options);
        return _createIndex(newIndex)
            .then(() => isAvailable(newIndex))
            .then(() => resolve(api))
            .catch((err) => {
                const error = new TSError(err, { reason: `Error created job index: ${indexName}` });
                logger.error(error);
                logger.info(`Attempting to connect to elasticsearch: ${clientName}`);
                const checking = setInterval(() => {
                    if (isShutdown) {
                        clearInterval(checking);
                        return;
                    }

                    _createIndex(newIndex)
                        .then(() => {
                            const query = { index: newIndex };
                            return elasticsearch.index_recovery(query);
                        })
                        .then((results) => {
                            let bool = false;
                            if (Object.keys(results).length !== 0) {
                                const isPrimary = _.filter(
                                    results[newIndex].shards,
                                    shard => shard.primary === true
                                );

                                bool = _.every(isPrimary, shard => shard.stage === 'DONE');
                            }

                            if (bool) {
                                clearInterval(checking);
                                logger.info('connection to elasticsearch has been established');
                                return isAvailable(newIndex)
                                    .then(() => {
                                        resolve(api);
                                    });
                            }
                            return true;
                        })
                        .catch((checkingErr) => {
                            const checkingError = new TSError(checkingErr);
                            logger.info(checkingError, `Attempting to connect to elasticsearch: ${clientName}`);
                        });
                }, 3000);
            });
    }));
};
