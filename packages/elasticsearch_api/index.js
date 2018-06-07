'use strict';

const Promise = require('bluebird');
const _ = require('lodash');
const parseError = require('error_parser');
const DOCUMENT_EXISTS = 409;

// Module to manage persistence in Elasticsearch.
// All functions in this module return promises that must be resolved to get the final result.
module.exports = function(client, logger, _opConfig) {
    const warning = _warn(logger, 'The elasticsearch cluster queues are overloaded, resubmitting failed queries from bulk');
    let config = _opConfig ? _opConfig : {};
    let retryStart = 5000;
    let retryLimit = 10000;

    if (client.__testing) {
        retryStart = client.__testing.start;
        retryLimit = client.__testing.limit;
    }

    function count(query) {
        query.size = 0;
        return _searchES(query)
            .then(data => data.hits.total);
    }

    function search(query) {
        return _searchES(query)
            .then(data => {
                if (config.full_response) {
                    return data
                }
                else {
                    return _.map(data.hits.hits, (doc) => doc._source);
                }
            });
    }

    function _makeRequest(clientBase, endpoint, query) {
        return new Promise(function(resolve, reject) {
            const errHandler = _errorHandler(_runRequest, query, reject, logger);

            function _runRequest() {
                clientBase[endpoint](query)
                    .then(result => resolve(result))
                    .catch(errHandler);
            }

            _runRequest();
        });
    }

    function _clientRequest(endpoint, query) {
        return _makeRequest(client, endpoint, query)
    }

    function _clientIndicesRequest(endpoint, query) {
        return _makeRequest(client.indices, endpoint, query)
    }

    function mget(query) {
        return _clientRequest('mget', query);
    }

    function get(query) {
        return _clientRequest('get', query)
            .then(result => result._source);
    }

    function index(query) {
        return _clientRequest('index', query);
    }

    function indexWithId(query) {
        return _clientRequest('index', query)
            .then(result => query.body);
    }

    function create(query) {
        return _clientRequest('create', query)
            .then(result => query.body);
    }

    function update(query) {
        return _clientRequest('update', query)
            .then(result => query.body.doc);
    }

    function remove(query) {
        return _clientRequest('delete', query)
            .then(result => result.found);
    }

    function indexExists(query) {
        return _clientIndicesRequest('exists', query);
    }

    function indexCreate(query) {
        return _clientIndicesRequest('create', query);
    }

    function indexRefresh(query) {
        return _clientIndicesRequest('refresh', query);
    }

    function indexRecovery(query) {
        return _clientIndicesRequest('recovery', query);
    }

    function nodeInfo() {
        return client.nodes.info();
    }

    function nodeStats() {
        return client.nodes.stats()
    }

    function _verifyIndex(indexObj, name) {
        let wasFound = false;
        const results = [];
        const regex = RegExp(name);

        //exact match of index
        if (indexObj[name]) {
            wasFound = true;
            let windowSize = indexObj[name].settings.index.max_result_window ? indexObj[name].settings.index.max_result_window : 10000;
            results.push({name: name, windowSize: windowSize})
        }
        else {
            //check to see if regex picks up indices
            _.forOwn(indexObj, function(value, key) {
                if (key.match(regex) !== null) {
                    wasFound = true;
                    let windowSize = value.settings.index.max_result_window ? value.settings.index.max_result_window : 10000;
                    results.push({name: key, windowSize: windowSize})
                }
            });
        }

        return {found: wasFound, indexWindowSize: results}
    }

    function version() {
        const wildCardRegex = RegExp(/\*/g);
        const isWildCardRegexSearch = config.index.match(wildCardRegex);
        // We cannot reliable search index queries with wildcards for existence or max_result_window, it could be
        // a cross cluster search, but we cant check cluster stats or settings as it could be in a different cluster.
        // A regular regex query will not error, it will just return no results which is not always an error
        if (isWildCardRegexSearch !== null) {
            logger.warn(`Running a regex or cross cluster search for ${config.index}, there is no reliable way to verify index and max_result_window`);
            return Promise.resolve(true);
        }

        return client.cluster.stats({})
            .then(function(data) {
                const version = data.nodes.versions[0];

                if (_checkVersion(version)) {
                    return client.indices.getSettings({})
                        .then(function(results) {
                            const index = _verifyIndex(results, config.index);
                            if (index.found) {
                                index.indexWindowSize.forEach(function(ind) {
                                    logger.warn(`max_result_window for index: ${ind.name} is set at ${ind.windowSize} . On very large indices it is possible that a slice can not be divided to stay below this limit. If that occurs an error will be thrown by Elasticsearch and the slice can not be processed. Increasing max_result_window in the Elasticsearch index settings will resolve the problem.`);
                                })
                            }
                            else {
                                return Promise.reject('index specified in reader does not exist')
                            }
                        }).catch(function(err) {
                            const errMsg = parseError(err);
                            logger.error(errMsg);
                            return Promise.reject(errMsg)
                        })
                }
            });
    }


    function putTemplate(template, name) {
        return _clientIndicesRequest('putTemplate', {body: template, name: name})
            .then(function(results) {
                return results
            })
            .catch(function(err) {
                const errMsg = parseError(err);
                return Promise.reject(errMsg)
            })
    }

    function _filterResponse(data, results) {
        const retry = [];
        const items = results.items;
        let nonRetriableError = false;
        let reason = '';
        for (let i = 0; i < items.length; i += 1) {
            //key could either be create or delete etc, just want the actual data at the value spot
            const item = _.values(items[i])[0];
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

    function bulkSend(data) {
        return new Promise(function(resolve, reject) {
            const retry = _retryFn(_sendData, data);

            function _sendData(formattedData) {
                return _clientRequest('bulk', {body: formattedData})
                    .then(function(results) {
                        if (results.errors) {
                            const response = _filterResponse(formattedData, results);

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
                                    retry(response.data);
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

            _sendData(data);
        });

    }

    function _warn(logger, msg) {
        return _.throttle(() => logger.warn(msg), 5000);
    }

    /*
     * These range query functions do not belong in this module.
     */
    function _buildRangeQuery(opConfig, msg) {
        const body = {
            query: {
                bool: {
                    must: []
                }
            }
        };
        // is a range type query
        if (msg.start && msg.end) {
            const dateObj = {};
            const date_field_name = opConfig.date_field_name;

            dateObj[date_field_name] = {
                gte: msg.start,
                lt: msg.end
            };

            body.query.bool.must.push({range: dateObj});
        }

        //elasticsearch _id based query
        if (msg.key) {
            body.query.bool.must.push({wildcard: {_uid: msg.key}})
        }

        //elasticsearch lucene based query
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
        const query = {
            index: opConfig.index,
            size: msg.count,
            body: _buildRangeQuery(opConfig, msg)
        };

        if (opConfig.fields) {
            query._source = opConfig.fields;
        }

        return query;
    }

    function _searchES(query) {
        return new Promise((resolve, reject) => {
            const errHandler = _errorHandler(_performSearch, query, reject, logger);
            const retry = _retryFn(_performSearch, query);

            function _performSearch(queryParam) {
                client.search(queryParam)
                    .then(function(data) {
                        if (data._shards.failed > 0) {
                            const reasons = _.uniq(_.flatMap(data._shards.failures, (shard) => shard.reason.type));

                            if (reasons.length > 1 || reasons[0] !== 'es_rejected_execution_exception') {
                                const errorReason = reasons.join(' | ');
                                logger.error('Not all shards returned successful, shard errors: ', errorReason);
                                reject(errorReason)
                            }
                            else {
                                retry()
                            }
                        }
                        else {
                            resolve(data)
                        }
                    })
                    .catch(errHandler);
            }

            _performSearch(query)
        })
    }

    function _retryFn(fn, data) {
        let retryTimer = {start: retryStart, limit: retryLimit};

        return (_data) => {
            const args = _data || data;
            let timer = Math.floor(Math.random() * (retryTimer.limit - retryTimer.start) + retryTimer.start);

            if (retryTimer.limit < 60000) {
                retryTimer.limit += retryLimit
            }
            if (retryTimer.start < 30000) {
                retryTimer.start += retryStart
            }
            setTimeout(function() {
                fn(args);
            }, timer);
        }
    }

    function _errorHandler(fn, data, reject, logger) {
        const retry = _retryFn(fn, data);
        return function(err) {
            const isRejectedError = _.get(err, 'body.error.type') === 'es_rejected_execution_exception';
            const isConnectionError = _.get(err, 'message') === 'No Living connections';
            if (isRejectedError) {
                // this iteration we will not handle with no living connections issue
                retry()
            }
            else {
                const errMsg = `invoking elasticsearch_api ${fn.name} resulted in a runtime error: ${parseError(err)}`;
                logger.error(errMsg);
                reject(errMsg)
            }
        }
    }

    function _checkVersion(str) {
        const num = Number(str.replace(/\./g, ''));
        return num >= 210;
    }

    function _isAvailable(index) {
        const query = {index: index, q: '*'};

        return new Promise(((resolve) => {
            search(query)
                .then((results) => {
                    logger.trace(`index ${index} is now available`);
                    resolve(results);
                })
                .catch(() => {
                    const isReady = setInterval(() => {
                        search(query)
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

    function _migrate(index, migrantIndexName, mapping, recordType, clusterName) {
        const reindexQuery = {
            slices: 4,
            waitForCompletion: true,
            refresh: true,
            body: {
                source: {
                    index: index
                },
                dest: {
                    index: migrantIndexName
                }
            }
        };
        let docCount;

        return Promise.all([
            count({index: index}),
            _createIndex(migrantIndexName, null, mapping, recordType, clusterName)
        ])
            .spread((_count) => {
                docCount = _count;
                return _clientRequest('reindex', reindexQuery);
            })
            .catch((err) => {
                const errMsg = `could not reindex for query ${JSON.stringify(reindexQuery)}, error: ${_parseTheError(err)}`;
                return Promise.reject(errMsg);
            })
            .then(() => count({index: migrantIndexName}))
            .then((_count) => {
                if (docCount !== _count) {
                    return Promise.reject(`reindex error, index: ${migrantIndexName} only has ${_count} docs, expected ${docCount} from index: ${index}`);
                }
                return true;
            })
            .then(() => _clientIndicesRequest('delete', { index: index }))
            .then(() => _clientIndicesRequest('putAlias', { index: migrantIndexName, name: index })
                .catch((err) => {
                    const errMsg = `could not put alias for index: ${migrantIndexName}, name: ${index}, error: ${parseError(err)}`;
                    return Promise.reject(errMsg);
                }));
    }

    function _parseTheError(err) {
       if (typeof err === 'string') return err;
       if(err.errMessage) return err.errMessage;
       return parseError(err)
    }

    function _createIndex(index, migrantIndexName, mapping, recordType, clusterName) {
        const existQuery = {index: index};

        return indexExists(existQuery)
            .then((exists) => {
                if (!exists) {
                    // Make sure the index exists before we do anything else.
                    const createQuery = {
                        index: index,
                        body: mapping
                    };

                    return _sendTemplate(mapping, recordType, clusterName)
                        .then(() => indexCreate(createQuery))
                        .then(results => results)
                        .catch((err) => {
                            // It's not really an error if it's just that the index is already there
                            if (err.match(/index_already_exists_exception/) === null) {
                                const errMsg = parseError(err);
                                logger.error(`Could not create index: ${index}, error: ${errMsg}`);
                                return Promise.reject(`Could not create job index, error: ${errMsg}`);
                            }
                            return true;
                        });
                }
                return _checkAndUpdateMapping(clusterName, index, migrantIndexName, mapping, recordType)
                    .catch((err) => {
                        const errMsg = `error while migrating index: ${existQuery.index}, error: ${_parseTheError(err)}`;
                        logger.error(errMsg);
                        return Promise.reject({fatal: true, errMessage: errMsg});
                    });
            });
    }

    function _verifyMapping(query, configMapping, recordType) {
        return _clientIndicesRequest('getMapping', query)
            .then(mapping => _areSameMappings(configMapping, mapping, recordType))
            .catch((err) => {
                const errMsg = `could not get mapping for query ${JSON.stringify(query)}, error: ${parseError(err)}`;
                return Promise.reject(errMsg);
            });
    }

    function _areSameMappings(configMapping, mapping, recordType) {
        const sysMapping = {};
        const index = Object.keys(mapping)[0];
        sysMapping[index] = { mappings: configMapping.mappings };
        // elasticsearch for some reason converts false to 'false' for dynamic key
        if (mapping[index].mappings[recordType].dynamic !== undefined) {
            mapping[index].mappings[recordType].dynamic = !'false';
        }
        const areEqual = _.isEqual(mapping, sysMapping);
        return { areEqual };
    }

    function _checkAndUpdateMapping(clusterName, index, migrantIndexName, mapping, recordType) {
        if (index === migrantIndexName || migrantIndexName === null) return Promise.reject(`index and migrant index names are the same: ${index}, please update the appropriate pacakge.json version`);
        const query = { index: index };
        return _verifyMapping(query, mapping, recordType)
            .then((results) => {
                if (results.areEqual) return true;
                // For state and analytics, we will not _migrate, but will post template so that
                // the next index will have them
                if (recordType === 'state' || recordType === 'analytics') {
                    return _sendTemplate(mapping, recordType, clusterName);
                }
                return _migrate(index, migrantIndexName, mapping, recordType, clusterName);
            });
    }

    function _sendTemplate(mapping, recordType, clusterName) {
        if (mapping.template) {
            const name = `${clusterName}_${recordType}_template`;
            // setting template name to reflect current teraslice instance name to help prevent
            // conflicts with differing versions of teraslice with same elastic db
            if (!mapping.template.match(clusterName)) {
                mapping.template = `${clusterName}${mapping.template}`;
            }
            return putTemplate(mapping, name);
        }

        return Promise.resolve(true);
    }

    function indexSetup(clusterName, newIndex, migrantIndexName, mapping, recordType, clientName, _time) {
        const intervalTime = _time || 3000;
        return new Promise((resolve, reject) => {
            _createIndex(newIndex, migrantIndexName, mapping, recordType, clusterName)
                .then(() => _isAvailable(newIndex))
                .then(() => resolve(true))
                .catch((err) => {
                    if (err.fatal) return reject(err.message);
                    const errMsg = parseError(err);
                    logger.error(`Error created index: ${errMsg}`);

                    logger.info(`Attempting to connect to elasticsearch: ${clientName}`);
                    const checking = setInterval(() => _createIndex(newIndex, migrantIndexName, mapping, recordType, clusterName)
                        .then(() => {
                            const query = {index: newIndex};
                            return indexRecovery(query);
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
                                return _isAvailable(newIndex)
                                    .then(() => resolve(true))
                            }
                            return true;
                        })
                        .catch((checkingError) => {
                            const checkingErrMsg = parseError(checkingError);
                            logger.info(`Attempting to connect to elasticsearch: ${clientName}, error: ${checkingErrMsg}`);
                        }), intervalTime);
                });
        });
    }

    return {
        search: search,
        count: count,
        get: get,
        mget: mget,
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
        indexExists: indexExists,
        indexCreate: indexCreate,
        indexRefresh: indexRefresh,
        indexRecovery: indexRecovery,
        indexSetup: indexSetup,
        // The APIs below are deprecated and should be removed.
        index_exists: indexExists,
        index_create: indexCreate,
        index_refresh: indexRefresh,
        index_recovery: indexRecovery
    };
};