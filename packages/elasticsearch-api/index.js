'use strict';

const Promise = require('bluebird');
const _ = require('lodash');
const parseError = require('@terascope/error-parser');

const DOCUMENT_EXISTS = 409;

// Module to manage persistence in Elasticsearch.
// All functions in this module return promises that must be resolved to get the final result.
module.exports = function elasticsearchApi(client = {}, logger, _opConfig) {
    const warning = _warn(logger, 'The elasticsearch cluster queues are overloaded, resubmitting failed queries from bulk');
    const config = _opConfig || {};
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
            .then((data) => {
                if (config.full_response) {
                    return data;
                }
                return _.map(data.hits.hits, doc => doc._source);
            });
    }

    function _makeRequest(clientBase, endpoint, query) {
        return new Promise(((resolve, reject) => {
            const errHandler = _errorHandler(_runRequest, query, reject, logger);

            function _runRequest() {
                clientBase[endpoint](query)
                    .then(result => resolve(result))
                    .catch(errHandler);
            }

            _runRequest();
        }));
    }

    function _clientRequest(endpoint, query) {
        return _makeRequest(client, endpoint, query);
    }

    function _clientIndicesRequest(endpoint, query) {
        return _makeRequest(client.indices, endpoint, query);
    }

    function mget(query) {
        return _clientRequest('mget', query);
    }

    function get(query) {
        return _clientRequest('get', query)
            .then(result => result._source);
    }

    function indexFn(query) {
        return _clientRequest('index', query);
    }

    function indexWithId(query) {
        return _clientRequest('index', query)
            .then(() => query.body);
    }

    function create(query) {
        return _clientRequest('create', query)
            .then(() => query.body);
    }

    function update(query) {
        return _clientRequest('update', query)
            .then(() => query.body.doc);
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
        return client.nodes.stats();
    }

    function _verifyIndex(indexObj, name) {
        let wasFound = false;
        const results = [];
        const regex = RegExp(name);

        // exact match of index
        if (indexObj[name]) {
            wasFound = true;
            if (indexObj[name].settings.index.max_result_window) {
                results.push({ name, windowSize: indexObj[name].settings.index.max_result_window });
            } else {
                results.push({ name, windowSize: 10000 });
            }
        } else {
            // check to see if regex picks up indices
            _.forOwn(indexObj, (value, key) => {
                if (key.match(regex) !== null) {
                    wasFound = true;
                    if (value.settings.index.max_result_window) {
                        results.push({
                            name: key,
                            windowSize: value.settings.index.max_result_window
                        });
                    } else {
                        results.push({ name: key, windowSize: 10000 });
                    }
                }
            });
        }

        return { found: wasFound, indexWindowSize: results };
    }

    function version() {
        const wildCardRegex = RegExp(/\*/g);
        const isWildCardRegexSearch = config.index.match(wildCardRegex);
        // We cannot reliable search index queries with wildcards
        // for existence or max_result_window, it could be
        // a cross cluster search, but we cant check cluster
        // stats or settings as it could be in a different cluster.
        // A regular regex query will not error, it will just return
        // no results which is not always an error
        if (isWildCardRegexSearch !== null) {
            logger.warn(`Running a regex or cross cluster search for ${config.index}, there is no reliable way to verify index and max_result_window`);
            return Promise.resolve(true);
        }
        return client.cluster.stats({})
            .then((data) => {
                if (!_checkVersion(data.nodes.versions[0])) {
                    return Promise.resolve();
                }
                return client.indices.getSettings({})
                    .then((results) => {
                        const resultIndex = _verifyIndex(results, config.index);
                        if (resultIndex.found) {
                            resultIndex.indexWindowSize.forEach((ind) => {
                                logger.warn(`max_result_window for index: ${ind.name} is set at ${ind.windowSize} . On very large indices it is possible that a slice can not be divided to stay below this limit. If that occurs an error will be thrown by Elasticsearch and the slice can not be processed. Increasing max_result_window in the Elasticsearch index settings will resolve the problem.`);
                            });
                        } else {
                            return Promise.reject('index specified in reader does not exist');
                        }
                        return Promise.resolve();
                    }).catch((err) => {
                        const errMsg = parseError(err);
                        logger.error(errMsg);
                        return Promise.reject(errMsg);
                    });
            });
    }


    function putTemplate(template, name) {
        return _clientIndicesRequest('putTemplate', { body: template, name })
            .then(results => results)
            .catch((err) => {
                const errMsg = parseError(err);
                return Promise.reject(errMsg);
            });
    }

    function _filterResponse(data, results) {
        const retry = [];
        const { items } = results;
        let nonRetriableError = false;
        let reason = '';
        for (let i = 0; i < items.length; i += 1) {
            // key could either be create or delete etc, just want the actual data at the value spot
            const item = _.values(items[i])[0];
            if (item.error) {
                // On a create request if a document exists it's not an error.
                // are there cases where this is incorrect?
                if (item.status === DOCUMENT_EXISTS) {
                    continue; // eslint-disable-line
                }

                if (item.error.type === 'es_rejected_execution_exception') {
                    if (i === 0) {
                        retry.push(data[0], data[1]);
                    } else {
                        retry.push(data[(i * 2)], data[(i * 2) + 1]);
                    }
                } else if (item.error.type !== 'document_already_exists_exception' && item.error.type !== 'document_missing_exception') {
                    nonRetriableError = true;
                    reason = `${item.error.type}--${item.error.reason}`;
                    break;
                }
            }
        }

        if (nonRetriableError) {
            return { data: [], error: nonRetriableError, reason };
        }

        return { data: retry, error: false };
    }

    function bulkSend(data) {
        return new Promise(((resolve, reject) => {
            const retry = _retryFn(_sendData, data);

            function _sendData(formattedData) {
                return _clientRequest('bulk', { body: formattedData })
                    .then((results) => {
                        if (results.errors) {
                            const response = _filterResponse(formattedData, results);

                            if (response.error) {
                                reject(response.reason);
                            } else if (response.data.length === 0) {
                                // may get doc already created error, if so just return
                                resolve(results);
                            } else {
                                warning();
                                retry(response.data);
                            }
                        } else {
                            resolve(results);
                        }
                    })
                    .catch((err) => {
                        const errMsg = parseError(err);
                        logger.error(`bulk sender error: ${errMsg}`);
                        reject(`bulk sender error: ${errMsg}`);
                    });
            }

            _sendData(data);
        }));
    }

    function _warn(warnLogger, msg) {
        return _.throttle(() => warnLogger.warn(msg), 5000);
    }

    function validateGeoParameters(opConfig) {
        const {
            geo_field: geoField,
            geo_box_top_left: geoBoxTopLeft,
            geo_box_bottom_right: geoBoxBottomRight,
            geo_point: geoPoint,
            geo_distance: geoDistance,
            geo_sort_point: geoSortPoint,
            geo_sort_order: geoSortOrder,
            geo_sort_unit: geoSortUnit
        } = opConfig;

        function isBoundingBoxQuery() {
            return geoBoxTopLeft && geoBoxBottomRight;
        }

        function isGeoDistanceQuery() {
            return geoPoint && geoDistance;
        }

        if (geoBoxTopLeft && geoPoint) {
            throw new Error('geo_box and geo_distance queries can not be combined.');
        }

        if ((geoPoint && !geoDistance) || (!geoPoint && geoDistance)) {
            throw new Error('Both geo_point and geo_distance must be provided for a geo_point query.');
        }

        if ((geoBoxTopLeft && !geoBoxBottomRight) || (!geoBoxTopLeft && geoBoxBottomRight)) {
            throw new Error('Both geo_box_top_left and geo_box_bottom_right must be provided for a geo bounding box query.');
        }

        if (geoBoxTopLeft && (geoSortOrder || geoSortUnit) && !geoSortPoint) {
            throw new Error('bounding box search requires geo_sort_point to be set if any other geo_sort_* parameter is provided');
        }

        if ((geoBoxTopLeft || geoPoint || geoDistance || geoSortPoint) && !geoField) {
            throw new Error('geo box search requires geo_field to be set if any other geo query parameters are provided');
        }

        if (geoField && !(isBoundingBoxQuery() || isGeoDistanceQuery())) {
            throw new Error('if geo_field is specified then the appropriate geo_box or geo_distance query parameters need to be provided as well');
        }
    }

    function geoSearch(opConfig) {
        let isGeoSort = false;
        const queryResults = {};
        // check for key existence to see if they are user defined
        if (opConfig.geo_sort_order || opConfig.geo_sort_unit || opConfig.geo_sort_point) {
            isGeoSort = true;
        }

        const {
            geo_box_top_left: geoBoxTopLeft,
            geo_box_bottom_right: geoBoxBottomRight,
            geo_point: geoPoint,
            geo_distance: geoDistance,
            geo_sort_point: geoSortPoint,
            geo_sort_order: geoSortOrder = 'asc',
            geo_sort_unit: geoSortUnit = 'm'
        } = opConfig;

        function createGeoSortQuery(location) {
            const sortedSearch = { _geo_distance: {} };
            sortedSearch._geo_distance[opConfig.geo_field] = {
                lat: location[0],
                lon: location[1]
            };
            sortedSearch._geo_distance.order = geoSortOrder;
            sortedSearch._geo_distance.unit = geoSortUnit;
            return sortedSearch;
        }

        let parsedGeoSortPoint;

        if (geoSortPoint) {
            parsedGeoSortPoint = createGeoPoint(geoSortPoint);
        }

        // Handle an Geo Bounding Box query
        if (geoBoxTopLeft) {
            const topLeft = createGeoPoint(geoBoxTopLeft);
            const bottomRight = createGeoPoint(geoBoxBottomRight);

            const searchQuery = {
                geo_bounding_box: {}
            };

            searchQuery.geo_bounding_box[opConfig.geo_field] = {
                top_left: {
                    lat: topLeft[0],
                    lon: topLeft[1]
                },
                bottom_right: {
                    lat: bottomRight[0],
                    lon: bottomRight[1]
                }
            };

            queryResults.query = searchQuery;

            if (isGeoSort) {
                queryResults.sort = createGeoSortQuery(parsedGeoSortPoint);
            }

            return queryResults;
        }

        if (geoDistance) {
            const location = createGeoPoint(geoPoint);
            const searchQuery = {
                geo_distance: {
                    distance: geoDistance
                }
            };

            searchQuery.geo_distance[opConfig.geo_field] = {
                lat: location[0],
                lon: location[1]
            };

            queryResults.query = searchQuery;
            const locationPoints = parsedGeoSortPoint || location;
            queryResults.sort = createGeoSortQuery(locationPoints);
        }

        return queryResults;
    }

    function createGeoPoint(point) {
        const pieces = point.split(',');
        return pieces;
    }

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
            const { date_field_name: dateFieldName } = opConfig;
            dateObj[dateFieldName] = {
                gte: msg.start,
                lt: msg.end
            };

            body.query.bool.must.push({ range: dateObj });
        }

        // elasticsearch _id based query
        if (msg.key) {
            body.query.bool.must.push({ wildcard: { _uid: msg.key } });
        }

        // elasticsearch lucene based query
        if (opConfig.query) {
            body.query.bool.must.push({
                query_string: {
                    query: opConfig.query
                }
            });
        }

        if (opConfig.geo_field) {
            validateGeoParameters(opConfig);
            const geoQuery = geoSearch(opConfig);
            body.query.bool.must.push(geoQuery.query);
            if (geoQuery.sort) body.sort = [geoQuery.sort];
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
                    .then((data) => {
                        const { failures, failed } = data._shards;
                        if (!failed) {
                            resolve(data);
                            return;
                        }

                        const reasons = _.uniq(_.flatMap(failures, shard => shard.reason.type));

                        if (reasons.length > 1 || reasons[0] !== 'es_rejected_execution_exception') {
                            const errorReason = reasons.join(' | ');
                            logger.error('Not all shards returned successful, shard errors: ', errorReason);
                            reject(errorReason);
                        } else {
                            retry();
                        }
                    })
                    .catch(errHandler);
            }

            _performSearch(query);
        });
    }

    function _retryFn(fn, data) {
        const retryTimer = { start: retryStart, limit: retryLimit };

        return (_data) => {
            const args = _data || data;
            const randomMs = Math.random() * (retryTimer.limit - retryTimer.start);
            const timer = Math.floor(randomMs + retryTimer.start);

            if (retryTimer.limit < 60000) {
                retryTimer.limit += retryLimit;
            }
            if (retryTimer.start < 30000) {
                retryTimer.start += retryStart;
            }
            setTimeout(() => {
                fn(args);
            }, timer);
        };
    }


    function _errorHandler(fn, data, reject, errorLogger) {
        const retry = _retryFn(fn, data);
        return function _errorHandlerFn(err) {
            const isRejectedError = _.get(err, 'body.error.type') === 'es_rejected_execution_exception';
            // const isConnectionError = _.get(err, 'message') === 'No Living connections';
            if (isRejectedError) {
                // this iteration we will not handle with no living connections issue
                retry();
            } else {
                const errMsg = `invoking elasticsearch-api ${fn.name} resulted in a runtime error: ${parseError(err)}`;
                errorLogger.error(errMsg);
                reject(errMsg);
            }
        };
    }

    function _checkVersion(str) {
        const num = Number(str.replace(/\./g, ''));
        return num >= 210;
    }

    function _isAvailable(index) {
        const query = { index, q: '*' };

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
                    index
                },
                dest: {
                    index: migrantIndexName
                }
            }
        };
        let docCount;

        return Promise.all([
            count({ index }),
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
            .then(() => count({ index: migrantIndexName }))
            .then((_count) => {
                if (docCount !== _count) {
                    return Promise.reject(`reindex error, index: ${migrantIndexName} only has ${_count} docs, expected ${docCount} from index: ${index}`);
                }
                return true;
            })
            .then(() => _clientIndicesRequest('delete', { index }))
            .then(() => _clientIndicesRequest('putAlias', { index: migrantIndexName, name: index })
                .catch((err) => {
                    const errMsg = `could not put alias for index: ${migrantIndexName}, name: ${index}, error: ${parseError(err)}`;
                    return Promise.reject(errMsg);
                }));
    }

    function _parseTheError(err) {
        if (typeof err === 'string') return err;
        if (err.errMessage) return err.errMessage;
        return parseError(err);
    }

    function _createIndex(index, migrantIndexName, mapping, recordType, clusterName) {
        const existQuery = { index };

        return indexExists(existQuery)
            .then((exists) => {
                if (!exists) {
                    // Make sure the index exists before we do anything else.
                    const createQuery = {
                        index,
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
                return _checkAndUpdateMapping(
                    clusterName,
                    index,
                    migrantIndexName,
                    mapping,
                    recordType
                ).catch((err) => {
                    const errMsg = `error while migrating index: ${existQuery.index}, error: ${_parseTheError(err)}`;
                    logger.error(errMsg);
                    return Promise.reject({ fatal: true, errMessage: errMsg });
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
        const query = { index };
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

    function indexSetup(clusterName, newIndex, migrantIndexName, mapping, recordType, clientName, _time) { // eslint-disable-line
        const giveupAfter = Date.now() + (_time || 3000);
        return new Promise((resolve, reject) => {
            const attemptToCreateIndex = () => {
                _createIndex(newIndex, migrantIndexName, mapping, recordType, clusterName)
                    .then(() => _isAvailable(newIndex))
                    .catch((err) => {
                        if (err.fatal) return Promise.reject(err);
                        const errMsg = parseError(err);
                        logger.error(`Error created index: ${errMsg}`);

                        logger.info(`Attempting to connect to elasticsearch: ${clientName}`);
                        return _createIndex(
                            newIndex,
                            migrantIndexName,
                            mapping,
                            recordType,
                            clusterName
                        ).then(() => {
                            const query = { index: newIndex };
                            return indexRecovery(query);
                        }).then((results) => {
                            let bool = false;
                            if (Object.keys(results).length !== 0) {
                                const isPrimary = _.filter(
                                    results[newIndex].shards,
                                    shard => shard.primary === true
                                );
                                bool = _.every(isPrimary, shard => shard.stage === 'DONE');
                            }
                            if (bool) {
                                logger.info('connection to elasticsearch has been established');
                                return _isAvailable(newIndex);
                            }
                            return Promise.resolve();
                        }).catch((checkingError) => {
                            const checkingErrMsg = parseError(checkingError);
                            logger.info(`Attempting to connect to elasticsearch: ${clientName}, error: ${checkingErrMsg}`);
                            if (Date.now() > giveupAfter) {
                                return Promise.reject(new Error(`Unable to create index ${newIndex}`));
                            }
                            return Promise.resolve();
                        })
                            .then(() => attemptToCreateIndex());
                    })
                    .then(() => resolve(true))
                    .catch((err) => {
                        reject(err.message);
                    });
            };
            attemptToCreateIndex();
        });
    }

    return {
        search,
        count,
        get,
        mget,
        index: indexFn,
        indexWithId,
        create,
        update,
        remove,
        version,
        putTemplate,
        bulkSend,
        nodeInfo,
        nodeStats,
        buildQuery,
        indexExists,
        indexCreate,
        indexRefresh,
        indexRecovery,
        indexSetup,
        validateGeoParameters,
        // The APIs below are deprecated and should be removed.
        index_exists: indexExists,
        index_create: indexCreate,
        index_refresh: indexRefresh,
        index_recovery: indexRecovery
    };
};
