'use strict';

const ms = require('ms');
const fs = require('fs');
const path = require('path');
const {
    TSError,
    parseError,
    isTest,
    pDelay,
    pRetry,
    logError,
    pWhile,
    isString,
    getTypeOf,
    get,
    random,
    isInteger
} = require('@terascope/utils');
const elasticsearchApi = require('@terascope/elasticsearch-api');
const { getClient } = require('@terascope/job-components');
const { makeLogger } = require('../../workers/helpers/terafoundation');
const { timeseriesIndex } = require('../../utils/date_utils');

module.exports = function elasticsearchStorage(backendConfig) {
    const {
        context,
        indexName,
        recordType,
        idField,
        storageName,
        bulkSize = 500,
        fullResponse = false,
        logRecord = true,
        forceRefresh = true,
    } = backendConfig;

    const logger = makeLogger(context, 'elasticsearch_backend', { storageName });

    const config = context.sysconfig.teraslice;

    const indexSettings = get(config, ['index_settings', storageName], {
        number_of_shards: 5,
        number_of_replicas: 1,
    });

    let elasticsearch;
    let client;
    let flushInterval;
    let isShutdown = false;

    // Buffer to build up bulk requests.
    let bulkQueue = [];
    let savingBulk = false; // serialize save requests.

    function validateId(recordId) {
        if (!recordId || !isString(recordId)) {
            throw new TSError(`Invalid ${recordType} id given ${getTypeOf(recordId)}`, {
                statusCode: 422
            });
        }
    }

    function validateIdAndRecord(recordId, record) {
        validateId(recordId);

        const id = record[idField];
        if (id && id !== recordId) {
            throw new TSError(`${recordType}.${idField} doesn't match request id`, {
                statusCode: 406
            });
        }
    }

    async function getRecord(recordId, indexArg, fields) {
        validateId(recordId);

        logger.trace(`getting record id: ${recordId}`);
        const query = {
            index: indexArg || indexName,
            type: recordType,
            id: recordId,
        };

        if (fields) {
            const esVersion = elasticsearch.getESVersion();
            if (esVersion > 6) {
                query._sourceIncludes = fields;
            } else {
                query._sourceInclude = fields;
            }
        }
        return elasticsearch.get(query);
    }

    async function search(query, from, size, sort, fields, indexArg = indexName) {
        if (from != null && !isInteger(from)) {
            throw new Error(`from parameter must be a integer, got ${from}`);
        }
        if (size != null && !isInteger(size)) {
            throw new Error(`size parameter must be a integer, got ${size}`);
        }
        if (sort != null && !isString(sort)) {
            throw new Error(`sort parameter must be a string, got ${sort}`);
        }

        const esQuery = {
            index: indexArg,
            from,
            size,
            sort,
        };

        if (typeof query === 'string') {
            esQuery.q = query;
        } else {
            esQuery.body = query;
        }

        if (fields) {
            const esVersion = elasticsearch.getESVersion();
            if (esVersion > 6) {
                esQuery._sourceIncludes = fields;
            } else {
                esQuery._sourceInclude = fields;
            }
        }

        return elasticsearch.search(esQuery);
    }

    /*
     * index saves a record to elasticsearch allowing automatic
     * ID creation
     */
    async function index(record, indexArg = indexName) {
        logger.trace('indexing record', logRecord ? record : undefined);
        const query = {
            index: indexArg,
            type: recordType,
            body: record,
            refresh: forceRefresh,
        };

        return elasticsearch.index(query);
    }

    /*
     * index saves a record to elasticsearch with a specified ID.
     * If the document is already there it will be replaced.
     */
    async function indexWithId(recordId, record, indexArg = indexName) {
        validateIdAndRecord(recordId, record);

        logger.trace(`indexWithId call with id: ${recordId}, record`, logRecord ? record : null);
        const query = {
            index: indexArg,
            type: recordType,
            id: recordId,
            body: record,
            refresh: forceRefresh,
        };

        return elasticsearch.indexWithId(query);
    }

    /*
     * Create saves a record to elasticsearch under the provided id.
     * If the record already exists it will not be inserted.
     */
    async function create(record, indexArg = indexName) {
        logger.trace('creating record', logRecord ? record : null);

        const query = {
            index: indexArg,
            type: recordType,
            id: record[idField],
            body: record,
            refresh: forceRefresh,
        };

        return elasticsearch.create(query);
    }

    async function count(query, from, sort, indexArg = indexName) {
        if (from != null && !isInteger(from)) {
            throw new Error(`from parameter must be a integer, got ${from}`);
        }
        if (sort != null && !isString(sort)) {
            throw new Error(`sort parameter must be a string, got ${sort}`);
        }

        const esQuery = {
            index: indexArg,
            from,
            sort,
        };

        if (isString(query)) {
            esQuery.q = query;
        } else {
            esQuery.body = query;
        }

        return elasticsearch.count(esQuery);
    }

    async function update(recordId, updateSpec, indexArg = indexName) {
        validateIdAndRecord(recordId, updateSpec);

        logger.trace(`updating record ${recordId}, `, logRecord ? updateSpec : null);

        const query = {
            index: indexArg,
            type: recordType,
            id: recordId,
            body: {
                doc: updateSpec,
            },
            refresh: forceRefresh,
            retryOnConflict: 3,
        };

        return elasticsearch.update(query);
    }

    async function updatePartial(recordId, applyChanges, indexArg = indexName) {
        if (typeof applyChanges !== 'function') {
            throw new Error('Update Partial expected a applyChanges function');
        }

        validateId(recordId);
        await waitForClient();

        const getParams = {
            index: indexArg,
            type: recordType,
            id: recordId,
        };

        const existing = await pRetry(() => elasticsearch.get(getParams, true), {
            matches: ['no_shard_available_action_exception'],
            delay: 1000,
            retries: 10,
            backoff: 5
        });

        const doc = await applyChanges(Object.assign({}, existing._source));

        logger.trace(`updating partial record ${recordId}, `, logRecord ? doc : null);

        validateIdAndRecord(recordId, doc);

        const query = {
            index: indexArg,
            type: recordType,
            id: recordId,
            body: doc,
            refresh: forceRefresh,
        };

        const esVersion = elasticsearch.getESVersion();

        if (esVersion >= 7) {
            query.if_seq_no = existing._seq_no;
            query.if_primary_term = existing._primary_term;
        } else {
            query.version = existing._version;
        }

        try {
            await elasticsearch.indexWithId(query);
            return doc;
        } catch (err) {
            // if there is a version conflict
            if (err.statusCode === 409 && err.message.includes('version conflict')) {
                logger.debug({ error: err }, `version conflict when updating "${recordId}" (${recordType})`);
                return updatePartial(recordId, applyChanges, indexArg);
            }

            throw new TSError(err);
        }
    }

    async function remove(recordId, indexArg = indexName) {
        validateId(recordId);

        logger.trace(`removing record ${recordId}`);
        const query = {
            index: indexArg,
            type: recordType,
            id: recordId,
            refresh: forceRefresh,
        };

        return elasticsearch.remove(query);
    }

    async function bulk(record, _type, indexArg = indexName) {
        if (isShutdown) {
            throw new TSError('Unable to send bulk record after shutdown', {
                context: {
                    recordType,
                    record,
                },
            });
        }

        const type = _type || 'index';

        const indexRequest = {
            [type]: {
                _index: indexArg,
                _type: recordType,
            }
        };

        bulkQueue.push(indexRequest, record);

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
            return _flush(true);
        }

        return new Promise((resolve, reject) => {
            logger.trace(`attempting to shutdown, will destroy in ${config.shutdown_timeout}`);
            const timeout = setTimeout(_destroy, config.shutdown_timeout).unref();

            function _destroy(err) {
                logger.trace(`shutdown store, took ${ms(Date.now() - startTime)}`);

                bulkQueue.length = [];
                isShutdown = true;
                clearTimeout(timeout);

                if (err) reject(err);
                else resolve();
            }

            _flush(true)
                .then(() => {
                    _destroy();
                })
                .catch((err) => {
                    _destroy(err);
                });
        });
    }

    async function bulkSend(bulkRequest) {
        const recordCount = (bulkRequest.length / 2);

        await pRetry(async () => elasticsearch.bulkSend(bulkRequest), {
            reason: `Failure to bulk create "${recordType}"`,
            logError: logger.warn,
            delay: isTest ? 100 : 1000,
            backoff: 5,
            retries: 100,
        });

        return recordCount;
    }

    async function _flush(shuttingDown = false) {
        if (!bulkQueue.length) return;
        if (!shuttingDown && savingBulk) return;

        savingBulk = true;

        const bulkRequest = bulkQueue.slice();
        bulkQueue = [];

        try {
            const recordCount = await bulkSend(bulkRequest);
            const extraMsg = shuttingDown ? ', on shutdown' : '';
            logger.debug(`flushed ${recordCount}${extraMsg} records to index ${indexName}`);
        } finally {
            savingBulk = false;
        }
    }

    function getMapFile() {
        const mappingFile = path.join(__dirname, `mappings/${recordType}.json`);

        const mapping = JSON.parse(fs.readFileSync(mappingFile));
        mapping.settings = {
            'index.number_of_shards': indexSettings.number_of_shards,
            'index.number_of_replicas': indexSettings.number_of_replicas,
        };
        return mapping;
    }

    async function sendTemplate(mapping) {
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

    async function _createIndex(indexArg = indexName) {
        const existQuery = { index: indexArg };
        return elasticsearch.index_exists(existQuery).then((exists) => {
            if (!exists) {
                const mapping = getMapFile();

                // Make sure the index exists before we do anything else.
                const createQuery = {
                    index: indexArg,
                    body: mapping,
                };

                // add a random delay to stagger requests
                return pDelay(isTest ? 0 : random(0, 5000))
                    .then(() => sendTemplate(mapping))
                    .then(() => elasticsearch.index_create(createQuery))
                    .then((results) => results)
                    .catch((err) => {
                        // It's not really an error if it's just that the index is already there
                        if (parseError(err).includes('already_exists_exception')) {
                            return true;
                        }

                        const error = new TSError(err, {
                            reason: `Could not create index: ${indexName}`,
                        });
                        return Promise.reject(error);
                    });
            }

            // Index already exists. nothing to do.
            return true;
        });
    }

    function refresh(indexArg = indexName) {
        const query = { index: indexArg };
        return elasticsearch.index_refresh(query);
    }

    function putTemplate(template, name) {
        return elasticsearch.putTemplate(template, name);
    }

    function verifyClient() {
        if (isShutdown) return false;
        return elasticsearch.verifyClient();
    }

    async function waitForClient() {
        if (elasticsearch.verifyClient()) return;

        await pWhile(async () => {
            if (isShutdown) throw new Error('Elasticsearch store is shutdown');
            if (elasticsearch.verifyClient()) return true;
            await pDelay(100);
            return false;
        });
    }

    // Periodically flush the bulkQueue so we don't end up with cached data lingering.
    flushInterval = setInterval(() => {
        _flush().catch((err) => {
            logError(logger, err, 'background flush failure');
            return null;
        });
        // stager the interval to avoid collisions
    }, random(9000, 11000));

    // javascript is having a fit if you use the shorthand get, so we renamed function to getRecord
    const api = {
        get: getRecord,
        search,
        refresh,
        index,
        indexWithId,
        create,
        update,
        updatePartial,
        bulk,
        bulkSend,
        remove,
        shutdown,
        count,
        putTemplate,
        waitForClient,
        verifyClient,
    };

    const isMultiIndex = indexName[indexName.length - 1] === '*';
    let newIndex = indexName;

    if (isMultiIndex) {
        const storeType = indexName.match(/__(.*)\*/)[1];
        const timeseriesFormat = config.index_rollover_frequency[storeType];
        const nameSize = indexName.length - 1;
        newIndex = timeseriesIndex(timeseriesFormat, indexName.slice(0, nameSize)).index;
    }

    return new Promise((resolve, reject) => {
        const clientName = JSON.stringify({
            connection: config.state.connection,
            index: indexName,
        });

        const connectionConfig = Object.assign({}, config.state);
        if (connectionConfig.connection_cache == null) {
            connectionConfig.connection_cache = true;
        }
        client = getClient(context, connectionConfig, 'elasticsearch');
        if (!client) {
            reject(new Error(`Unable to get client for connection: ${config.state.connection}`));
            return;
        }

        let { connection } = config.state;
        if (config.state.endpoint) {
            connection += `:${config.state.endpoint}`;
        }

        const options = {
            full_response: !!fullResponse,
            connection,
        };

        elasticsearch = elasticsearchApi(client, logger, options);
        _createIndex(newIndex)
            .then(() => elasticsearch.isAvailable(newIndex, recordType))
            .then(() => resolve(api))
            .catch((err) => {
                const error = new TSError(err, {
                    reason: `Failure initializing ${recordType} index: ${indexName}`,
                });
                if (error.statusCode >= 400 && error.statusCode < 500) {
                    reject(err);
                    return;
                }

                logError(logger, error, `Failed attempt connecting to elasticsearch: ${clientName} (will retry)`);
                let running = false;

                const checking = setInterval(() => {
                    if (isShutdown) {
                        clearInterval(checking);
                        return;
                    }
                    if (running) return;
                    running = true;

                    _createIndex(newIndex)
                        .then(() => {
                            const query = { index: newIndex };
                            return elasticsearch.index_recovery(query);
                        })
                        .then((results) => {
                            let bool = false;
                            const shards = get(results, [newIndex, 'shards'], []);
                            if (shards.length) {
                                bool = shards
                                    .filter((shard) => shard.primary)
                                    .every((shard) => shard.stage === 'DONE');
                            }

                            if (bool) {
                                clearInterval(checking);
                                logger.info('connection to elasticsearch has been established');
                                return elasticsearch.isAvailable(newIndex, recordType).then(() => {
                                    resolve(api);
                                });
                            }
                            return true;
                        })
                        .then(() => {
                            running = false;
                        })
                        .catch((checkingErr) => {
                            // add a random delay to stagger requests
                            pDelay(isTest ? 0 : random(0, 1000)).then(() => {
                                running = false;
                                const checkingError = new TSError(checkingErr, {
                                    reason: `Attempting to connect to elasticsearch: ${clientName}`,
                                });
                                logger.info(checkingError.message);
                            });
                        });
                }, 3000);
            });
    });
};
