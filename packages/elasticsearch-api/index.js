// polyfill because opensearch has references to an api that won't exist
// on the client side, should be able to remove in the future
import Promise from 'bluebird';
import {
    isTest, TSError, isFatalError,
    parseError, getBackoffDelay, isRetryableError,
    get, toNumber, isString, isSimpleObject,
    castArray, flatten, toBoolean,
    uniq, random, cloneDeep, DataEntity,
    isDeepEqual, getTypeOf, isProd
} from '@terascope/utils';
import { ElasticsearchDistribution } from '@terascope/types';

import('setimmediate');

const DOCUMENT_EXISTS = 409;
const TOO_MANY_REQUESTS = 429;

// Module to manage persistence in Elasticsearch.
// All functions in this module return promises that must be resolved to get the final result.
export default function elasticsearchApi(client, logger, _opConfig) {
    const config = _opConfig || {};
    if (!client) {
        throw new Error('Elasticsearch API requires client');
    }
    if (!logger) {
        throw new Error('Elasticsearch API requires logger');
    }

    const warning = _warn(
        logger,
        'The elasticsearch cluster queues are overloaded, resubmitting failed queries from bulk'
    );

    const retryStart = get(client, '__testing.start', 5000);
    const retryLimit = get(client, '__testing.limit', 10000);

    const { connection = 'unknown' } = config;

    async function count(query) {
        query.size = 0;
        const response = await _searchES(query);

        const data = get(response, 'hits.total.value', get(response, 'hits.total'));

        return data;
    }

    function convertDocToDataEntity(doc) {
        const now = Date.now();
        const metadata = {
            _key: doc._id,
            _processTime: now,
            /** @todo this should come from the data */
            _ingestTime: now,
            /** @todo this should come from the data */
            _eventTime: now,
            // pass only the record metadata
            _index: doc._index,
            _version: doc._version,
            _seq_no: doc._seq_no,
            _primary_term: doc._primary_term
        };
        return DataEntity.make(doc._source, metadata);
    }

    async function search(query) {
        const data = await _searchES(query);

        if (config.full_response) {
            return data;
        }

        if (!data.hits.hits) return [];
        return data.hits.hits.map(convertDocToDataEntity);
    }

    function _makeRequest(clientBase, endpoint, query, fnNamePrefix) {
        return new Promise((resolve, reject) => {
            const fnName = `${fnNamePrefix || ''}->${endpoint}()`;
            const errHandler = _errorHandler(_runRequest, query, reject, fnName);

            function _runRequest() {
                clientBase[endpoint](query)
                    .then((rawResponse) => {
                        const response = get(rawResponse, 'body', rawResponse);
                        resolve(response);
                    })
                    .catch(errHandler);
            }

            waitForClient(() => _runRequest(), reject);
        });
    }

    function _clientRequest(endpoint, query) {
        return _makeRequest(client, endpoint, query);
    }

    function _clientIndicesRequest(endpoint, query) {
        return _makeRequest(client.indices, endpoint, query, 'indices');
    }

    function mget(query, fullResponse = false) {
        return _clientRequest('mget', _adjustTypeForEs7(query))
            .then((results) => {
                if (fullResponse) return results;
                return results.docs
                    .filter((doc) => doc.found)
                    .map(convertDocToDataEntity);
            });
    }

    function getFn(query, fullResponse = false) {
        if (fullResponse) {
            return _clientRequest('get', query);
        }
        return _clientRequest('get', query)
            .then(convertDocToDataEntity);
    }

    function indexFn(query) {
        return _clientRequest('index', _adjustTypeForEs7(query));
    }

    function indexWithId(query) {
        return _clientRequest('index', _adjustTypeForEs7(query)).then(() => query.body);
    }

    function create(query) {
        return _clientRequest('create', _adjustTypeForEs7(query)).then(() => query.body);
    }

    function update(query) {
        return _clientRequest('update', _adjustTypeForEs7(query)).then(() => query.body.doc);
    }

    function remove(query) {
        return _clientRequest('delete', _adjustTypeForEs7(query)).then((result) => result.found);
    }

    function indexExists(query) {
        return _clientIndicesRequest('exists', query);
    }

    function indexCreate(query) {
        const params = _fixMappingRequest(query, false);
        return _clientIndicesRequest('create', params);
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
            Object.entries(indexObj).forEach(([key, value]) => {
                if (key.match(regex) !== null) {
                    wasFound = true;
                    if (value.settings.index.max_result_window) {
                        results.push({
                            name: key,
                            windowSize: value.settings.index.max_result_window,
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
        const wildCardRegex = /\*/g;
        const isWildCardRegexSearch = config.index.match(wildCardRegex);
        // We cannot reliable search index queries with wildcards
        // for existence or max_result_window, it could be
        // a cross cluster search, but we cant check cluster
        // stats or settings as it could be in a different cluster.
        // A regular regex query will not error, it will just return
        // no results which is not always an error
        if (isWildCardRegexSearch !== null) {
            logger.warn(
                `Running a regex or cross cluster search for ${config.index}, there is no reliable way to verify index and max_result_window`
            );
            return Promise.resolve(true);
        }

        return client.indices
            .getSettings({})
            .then((results) => {
                const settingsData = results.body && results.meta ? results.body : results;
                const resultIndex = _verifyIndex(settingsData, config.index);

                if (resultIndex.found) {
                    resultIndex.indexWindowSize.forEach((ind) => {
                        logger.warn(
                            `max_result_window for index: ${ind.name} is set at ${ind.windowSize}. On very large indices it is possible that a slice can not be divided to stay below this limit. If that occurs an error will be thrown by Elasticsearch and the slice can not be processed. Increasing max_result_window in the Elasticsearch index settings will resolve the problem.`
                        );
                    });
                } else {
                    const error = new TSError('index specified in reader does not exist', {
                        statusCode: 404,
                    });
                    return Promise.reject(error);
                }

                return Promise.resolve();
            })
            .catch((err) => Promise.reject(new TSError(err)));
    }

    function putTemplate(template, name) {
        const params = _fixMappingRequest({ body: template, name }, true);
        return _clientIndicesRequest('putTemplate', params).then(
            (results) => results
        );
    }

    /**
     * When the bulk request has errors this will find the actions
     * records to retry.
     *
     * @returns {{
     *    retry: Record<string, any>[],
     *    successful: number,
     *    error: boolean,
     *    reason?: string
     * }}
    */
    function _filterRetryRecords(actionRecords, result) {
        const retry = [];
        const { items } = result;

        let nonRetriableError = false;
        let reason = '';
        let successful = 0;

        for (let i = 0; i < items.length; i++) {
            // key could either be create or delete etc, just want the actual data at the value spot
            const item = Object.values(items[i])[0];
            if (item.error) {
                // On a create request if a document exists it's not an error.
                // are there cases where this is incorrect?
                if (item.status === DOCUMENT_EXISTS) {
                    continue;
                }

                if (item.status === TOO_MANY_REQUESTS || item.error.type === 'es_rejected_execution_exception') {
                    if (actionRecords[i] == null) {
                        // this error should not happen in production,
                        // only in tests where the bulk function is mocked
                        throw new Error(`Invalid item index (${i}), not found in bulk send records (length: ${actionRecords.length})`);
                    }
                    // the index in the item list will match the index in the
                    // input records
                    retry.push(actionRecords[i]);
                } else if (
                    item.error.type !== 'document_already_exists_exception'
                    && item.error.type !== 'document_missing_exception'
                ) {
                    nonRetriableError = true;
                    reason = `${item.error.type}--${item.error.reason}`;

                    if (config._dead_letter_action === 'kafka_dead_letter') {
                        actionRecords[i].data.setMetadata('_bulk_sender_rejection', reason);
                        continue;
                    }

                    break;
                }
            } else if (item.status == null || item.status < 400) {
                successful++;
            }
        }

        if (nonRetriableError) {
            // if dlq active still attempt the retries
            const retryOnError = config._dead_letter_action === 'kafka_dead_letter' ? retry : [];

            return {
                retry: retryOnError, successful, error: true, reason
            };
        }

        return { retry, successful, error: false };
    }

    function getFirstKey(obj) {
        return Object.keys(obj)[0];
    }

    /**
     * @param data {Array<{ action: data }>}
     * @returns {Promise<number>}
    */
    async function _bulkSend(actionRecords, previousCount = 0, previousRetryDelay = 0) {
        const body = actionRecords.flatMap((record, index) => {
            if (record.action == null) {
                let dbg = '';
                if (!isProd) {
                    dbg = `, dbg: ${JSON.stringify({ record, index })}`;
                }
                throw new Error(`Bulk send record is missing the action property${dbg}`);
            }

            if (!isElasticsearch6()) {
                const actionKey = getFirstKey(record.action);
                const { _type, ...withoutTypeAction } = record.action[actionKey];
                // if data is specified return both
                return record.data
                    ? [{
                        ...record.action,
                        [actionKey]: withoutTypeAction
                    },
                    record.data]
                    : [{
                        ...record.action,
                        [actionKey]: withoutTypeAction
                    }];
            }

            // if data is specified return both
            return record.data ? [record.action, record.data] : [record.action];
        });

        const response = await _clientRequest('bulk', { body });
        const results = response.body ? response.body : response;

        if (!results.errors) {
            return results.items.reduce((c, item) => {
                const [value] = Object.values(item);
                // ignore non-successful status codes
                if (value.status != null && value.status >= 400) return c;
                return c + 1;
            }, 0);
        }

        const {
            retry, successful, error, reason
        } = _filterRetryRecords(actionRecords, results);

        if (error && config._dead_letter_action !== 'kafka_dead_letter') {
            throw new Error(`bulk send error: ${reason}`);
        }

        if (retry.length === 0) {
            return previousCount + successful;
        }

        return _handleRetries(retry, previousCount + successful, previousRetryDelay);
    }

    async function _handleRetries(retry, affectedCount, previousRetryDelay) {
        warning();

        const nextRetryDelay = await _awaitRetry(previousRetryDelay);
        return _bulkSend(retry, affectedCount, nextRetryDelay);
    }

    /**
     * The new and improved bulk send with proper retry support
     *
     * @returns {Promise<number>} the number of affected rows
    */
    function bulkSend(data) {
        if (!Array.isArray(data)) {
            throw new Error(`Expected bulkSend to receive an array, got ${data} (${getTypeOf(data)})`);
        }

        return Promise.resolve(_bulkSend(data));
    }

    function _warn(warnLogger, msg) {
        let _lastTime = null;
        return () => {
            const lastTime = _lastTime;
            _lastTime = Date.now();
            if (lastTime != null) {
                const elapsed = Date.now() - lastTime;
                if (elapsed < 5000) {
                    return;
                }
            }
            warnLogger.warn(msg);
        };
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
            geo_sort_unit: geoSortUnit,
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
            throw new Error(
                'Both geo_point and geo_distance must be provided for a geo_point query.'
            );
        }

        if ((geoBoxTopLeft && !geoBoxBottomRight) || (!geoBoxTopLeft && geoBoxBottomRight)) {
            throw new Error(
                'Both geo_box_top_left and geo_box_bottom_right must be provided for a geo bounding box query.'
            );
        }

        if (geoBoxTopLeft && (geoSortOrder || geoSortUnit) && !geoSortPoint) {
            throw new Error(
                'bounding box search requires geo_sort_point to be set if any other geo_sort_* parameter is provided'
            );
        }

        if ((geoBoxTopLeft || geoPoint || geoDistance || geoSortPoint) && !geoField) {
            throw new Error(
                'geo box search requires geo_field to be set if any other geo query parameters are provided'
            );
        }

        if (geoField && !(isBoundingBoxQuery() || isGeoDistanceQuery())) {
            throw new Error(
                'if geo_field is specified then the appropriate geo_box or geo_distance query parameters need to be provided as well'
            );
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
            geo_sort_unit: geoSortUnit = 'm',
        } = opConfig;

        function createGeoSortQuery(location) {
            const sortedSearch = { _geo_distance: {} };
            sortedSearch._geo_distance[opConfig.geo_field] = {
                lat: location[0],
                lon: location[1],
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
                geo_bounding_box: {},
            };

            searchQuery.geo_bounding_box[opConfig.geo_field] = {
                top_left: {
                    lat: topLeft[0],
                    lon: topLeft[1],
                },
                bottom_right: {
                    lat: bottomRight[0],
                    lon: bottomRight[1],
                },
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
                    distance: geoDistance,
                },
            };

            searchQuery.geo_distance[opConfig.geo_field] = {
                lat: location[0],
                lon: location[1],
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
                    must: [],
                },
            },
        };
        // is a range type query
        if (msg.start && msg.end) {
            const dateObj = {};
            const { date_field_name: dateFieldName } = opConfig;
            dateObj[dateFieldName] = {
                gte: msg.start,
                lt: msg.end,
            };

            body.query.bool.must.push({ range: dateObj });
        }
        // TODO: deprecate this logic and remove in the future
        // elasticsearch _id based query
        if (msg.key) {
            body.query.bool.must.push({ wildcard: { _uid: msg.key } });
        }

        if (msg.wildcard) {
            const { field, value } = msg.wildcard;
            body.query.bool.must.push({ wildcard: { [field]: value } });
        }

        // elasticsearch lucene based query
        if (opConfig.query) {
            body.query.bool.must.push({
                query_string: {
                    query: opConfig.query,
                },
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
            body: _buildRangeQuery(opConfig, msg),
        };

        if (opConfig.fields) {
            query._source = opConfig.fields;
        }
        return query;
    }

    function _searchES(query) {
        return new Promise((resolve, reject) => {
            const errHandler = _errorHandler(_performSearch, query, reject, '->search()');
            const retry = _retryFn(_performSearch, query, reject);

            function _performSearch(queryParam) {
                client
                    .search(queryParam)
                    .then((data) => {
                        const failuresReasons = [];
                        const results = data.body ? data.body : data;
                        const { failures, failed } = results._shards;

                        if (!failed) {
                            resolve(results);
                            return;
                        }

                        failuresReasons.push(...failures);

                        const reasons = uniq(
                            flatten(failuresReasons.map((shard) => shard.reason.type))
                        );

                        if (
                            reasons.length > 1
                            || reasons[0] !== 'es_rejected_execution_exception'
                        ) {
                            const errorReason = reasons.join(' | ');
                            const error = new TSError(errorReason, {
                                reason: 'Not all shards returned successful',
                                context: {
                                    connection,
                                },
                            });
                            reject(error);
                        } else {
                            retry();
                        }
                    })
                    .catch(errHandler);
            }

            waitForClient(() => _performSearch(query), reject);
        });
    }

    function _adjustTypeForEs7(query) {
        if (!isElasticsearch6()) {
            if (Array.isArray(query)) {
                return _removeTypeFromBulkRequest(query);
            }
            delete query.type;
        }

        return query;
    }

    function _removeTypeFromBulkRequest(query) {
        if (isElasticsearch6()) return query;

        return query.map((queryItem) => {
            if (isSimpleObject(queryItem)) {
                // get the metadata and ignore the record
                const bulkMetaData = _getBulkMetaData(queryItem);

                if (_hasBulkMetaDataProps(bulkMetaData)) {
                    delete bulkMetaData._type;
                }
            }
            return queryItem;
        });
    }

    function _getBulkMetaData(queryItem) {
        // bulk actions are index, create, delete, and update
        return queryItem.index
            || queryItem.create
            || queryItem.delete
            || queryItem.update;
    }

    function _hasBulkMetaDataProps(bulkMetaData) {
        return bulkMetaData
            && isSimpleObject(bulkMetaData)
            && '_index' in bulkMetaData
            && '_id' in bulkMetaData
            && '_type' in bulkMetaData;
    }

    /**
     * Wait for the client to be available before resolving,
     * this will also naturally stagger many in-flight requests
     *
     * - reject if the connection is closed
     * - resolve after timeout to let the underlying client deal with any problems
    */
    function waitForClient(resolve, reject) {
        let intervalId = null;
        const startTime = Date.now();

        // set different values for when process.env.NODE_ENV === test
        const timeoutMs = isTest ? 1000 : random(5000, 15000);
        const intervalMs = isTest ? 50 : 100;

        // avoiding setting the interval if we don't need to
        if (_checkClient()) {
            return;
        }

        intervalId = setInterval(_checkClient, intervalMs);

        function _checkClient() {
            const elapsed = Date.now() - startTime;
            try {
                const valid = verifyClient();
                if (!valid && elapsed <= timeoutMs) return false;

                clearInterval(intervalId);
                resolve(elapsed);
                return true;
            } catch (err) {
                clearInterval(intervalId);
                reject(err);
                return true;
            }
        }
    }

    function _retryFn(fn, data, reject) {
        let delay = 0;

        return (_data) => {
            const args = _data || data;

            _awaitRetry(delay)
                .then((newDelay) => {
                    delay = newDelay;
                    fn(args);
                })
                .catch(reject);
        };
    }

    /**
     * @returns {Promise<number>} the delayed time
    */
    async function _awaitRetry(previousDelay = 0) {
        return new Promise((resolve, reject) => {
            waitForClient((elapsed) => {
                const delay = getBackoffDelay(previousDelay, 2, retryLimit, retryStart);

                let timeoutMs = delay - elapsed;
                if (timeoutMs < 1) timeoutMs = 1;

                setTimeout(resolve, timeoutMs, delay);
            }, reject);
        });
    }

    function isConnectionErrorMessage(err) {
        const msg = get(err, 'message', '');
        return msg.includes('No Living connections') || msg.includes('ECONNREFUSED');
    }

    function isErrorRetryable(err) {
        const checkErrorMsg = isRetryableError(err);

        if (checkErrorMsg) {
            return true;
        }

        const isRejectedError = get(err, 'body.error.type') === 'es_rejected_execution_exception';
        const isConnectionError = isConnectionErrorMessage(err);

        if (isRejectedError || isConnectionError) {
            return true;
        }

        return false;
    }

    function _errorHandler(fn, data, reject, fnName = '->unknown()') {
        const retry = _retryFn(fn, data, reject);

        return function _errorHandlerFn(err) {
            const retryable = isErrorRetryable(err);

            if (retryable) {
                retry();
            } else {
                reject(
                    new TSError(err, {
                        context: {
                            fnName,
                            connection,
                        },
                    })
                );
            }
        };
    }

    function isAvailable(index, recordType) {
        const query = {
            index,
            q: '',
            size: 0,
            terminate_after: '1',
        };

        const label = recordType ? `for ${recordType}` : index;

        return new Promise((resolve, reject) => {
            client
                .search(query)
                .then((results) => {
                    logger.trace(`index ${label} is now available`);
                    resolve(results);
                })
                .catch(() => {
                    let running = false;
                    const checkInterval = setInterval(() => {
                        if (running) return;
                        running = true;

                        try {
                            const valid = verifyClient();
                            if (!valid) {
                                logger.debug(`index ${label} is in an invalid state`);
                                return;
                            }
                        } catch (err) {
                            running = false;
                            clearInterval(checkInterval);
                            reject(err);
                            return;
                        }

                        client
                            .search(query)
                            .then((results) => {
                                running = false;

                                clearInterval(checkInterval);
                                resolve(results);
                            })
                            .catch(() => {
                                running = false;

                                logger.warn(`verifying index ${label} is open`);
                            });
                    }, 200);
                });
        });
    }
    // TODO: verifyClient needs to be checked with new client usage
    /**
     * Verify the state of the underlying es client.
     * Will throw error if in fatal state, like the connection is closed.
     *
     * @returns {boolean} if client is working state it will return true
    */
    function verifyClient() {
        const closed = get(client, 'transport.closed', false);
        if (closed) {
            throw new TSError('Elasticsearch Client is closed', {
                fatalError: true
            });
        }

        const alive = get(client, 'transport.connectionPool._conns.alive');
        // so we don't break existing tests with mocked clients, we will default to 1
        const aliveCount = alive && Array.isArray(alive) ? alive.length : 1;
        if (!aliveCount) {
            return false;
        }

        return true;
    }
    /** This is deprecated as an external api,
     * please use getClientMetadata
     * */
    function getESVersion() {
        const newClientVersion = get(client, '__meta.majorVersion');

        if (newClientVersion) return newClientVersion;

        // legacy
        const esVersion = get(client, 'transport._config.apiVersion', '6.5');

        if (esVersion && isString(esVersion)) {
            const [majorVersion] = esVersion.split('.');
            return toNumber(majorVersion);
        }

        return 6;
    }

    function getClientMetadata() {
        if (client.__meta) {
            return client.__meta;
        }

        const esVersion = get(client, 'transport._config.apiVersion', '6.5');
        const distribution = ElasticsearchDistribution.elasticsearch;
        const [majorVersion = 6, minorVersion = 5] = esVersion.split('.').map(toNumber);

        return {
            distribution,
            version: esVersion,
            majorVersion,
            minorVersion
        };
    }

    function isElasticsearch8() {
        const { distribution, majorVersion } = getClientMetadata();
        return distribution === ElasticsearchDistribution.elasticsearch && majorVersion === 8;
    }

    function isOpensearch2() {
        const { distribution, majorVersion } = getClientMetadata();
        return distribution === ElasticsearchDistribution.opensearch && majorVersion === 2;
    }

    function isOpensearch3() {
        const { distribution, majorVersion } = getClientMetadata();
        return distribution === ElasticsearchDistribution.opensearch && majorVersion === 3;
    }

    function _fixMappingRequest(_params, isTemplate) {
        if (!_params || !_params.body) {
            throw new Error('Invalid mapping request');
        }
        const params = cloneDeep(_params);
        const defaultParams = {};

        if (params.body.template != null) {
            if (isTemplate && params.body.index_patterns == null) {
                params.body.index_patterns = castArray(params.body.template).slice();
            }
            delete params.body.template;
        }

        if (!isElasticsearch6()) {
            const typeMappings = get(params.body, 'mappings', {});
            if (typeMappings.properties) {
                defaultParams.includeTypeName = false;
            } else {
                defaultParams.includeTypeName = true;
                Object.values(typeMappings).forEach((typeMapping) => {
                    if (typeMapping && typeMapping._all) {
                        delete typeMapping._all;
                    }
                    return '';
                });
            }
        }

        if (isElasticsearch8(client) || isOpensearch2(client) || isOpensearch3(client)) {
            delete defaultParams.includeTypeName;
        }

        return Object.assign({}, defaultParams, params);
    }

    function _migrate(index, migrantIndexName, mapping, recordType, clusterName) {
        const reindexQuery = {
            slices: 4,
            waitForCompletion: true,
            refresh: true,
            body: {
                source: {
                    index,
                },
                dest: {
                    index: migrantIndexName,
                },
            },
        };
        let docCount;

        return Promise.all([
            count({ index }),
            _createIndex(migrantIndexName, null, mapping, recordType, clusterName),
        ])
            .spread((_count) => {
                docCount = _count;
                return _clientRequest('reindex', reindexQuery);
            })
            .catch((err) => Promise.reject(
                new TSError(err, {
                    reason: `could not reindex for query ${JSON.stringify(reindexQuery)}`,
                    context: {
                        connection,
                    },
                })
            ))
            .then(() => count({ index: migrantIndexName }))
            .then((_count) => {
                if (docCount !== _count) {
                    const errMsg = `reindex error, index: ${migrantIndexName} only has ${_count} docs, expected ${docCount} from index: ${index}`;
                    return Promise.reject(new Error(errMsg));
                }
                return true;
            })
            .then(() => _clientIndicesRequest('delete', { index }))
            .then(() => _clientIndicesRequest('putAlias', { index: migrantIndexName, name: index }).catch(
                (err) => {
                    const error = new TSError(err, {
                        reason: `could not put alias for index: ${migrantIndexName}, name: ${index}`,
                    });
                    return Promise.reject(error);
                }
            ));
    }

    function _createIndex(index, migrantIndexName, mapping, recordType, clusterName) {
        const existQuery = { index };

        return indexExists(existQuery).then((exists) => {
            if (!exists) {
                // Make sure the index exists before we do anything else.
                const createQuery = {
                    index,
                    body: mapping,
                };

                return _sendTemplate(mapping, recordType, clusterName)
                    .then(() => indexCreate(createQuery))
                    .then((results) => results)
                    .catch((err) => {
                        // It's not really an error if it's just that the index is already there
                        const errStr = parseError(err, true);
                        if (!errStr.includes('already_exists_exception')) {
                            const error = new TSError(err, {
                                reason: `Could not create index: ${index}`,
                            });
                            return Promise.reject(error);
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
                const error = new TSError(err, {
                    reason: `error while migrating index: ${existQuery.index}`,
                    fatalError: true,
                });
                return Promise.reject(error);
            });
        })
            .catch((err) => Promise.reject(err));
    }

    function _verifyMapping(query, configMapping, recordType) {
        const params = Object.assign({}, query);

        if (!isElasticsearch6()) {
            if (recordType) {
                params.includeTypeName = true;
            }
        }
        return _clientIndicesRequest('getMapping', params)
            .then((mapping) => _areSameMappings(configMapping, mapping, recordType))
            .catch((err) => {
                const error = new TSError(err, {
                    reason: `could not get mapping for query ${JSON.stringify(params)}`,
                });
                return Promise.reject(error);
            });
    }

    function _areSameMappings(configMapping, mapping, recordType) {
        const sysMapping = {};
        const index = Object.keys(mapping)[0];
        sysMapping[index] = { mappings: configMapping.mappings };
        const { dynamic } = mapping[index].mappings[recordType];
        // elasticsearch for some reason converts false to 'false' for dynamic key
        if (dynamic !== undefined) {
            mapping[index].mappings[recordType].dynamic = toBoolean(dynamic);
        }
        const areEqual = isDeepEqual(mapping, sysMapping);
        return { areEqual };
    }

    function _checkAndUpdateMapping(clusterName, index, migrantIndexName, mapping, recordType) {
        if (index === migrantIndexName || migrantIndexName === null) {
            const error = new TSError(
                `index and migrant index names are the same: ${index}, please update the appropriate package.json version`
            );
            return Promise.reject(error);
        }

        const query = { index };
        return _verifyMapping(query, mapping, recordType).then((results) => {
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

    function indexSetup(
        clusterName,
        newIndex,
        migrantIndexName,
        mapping,
        recordType,
        clientName,
        _time
    ) {
        const giveupAfter = Date.now() + (_time || 10000);
        return new Promise((resolve, reject) => {
            const attemptToCreateIndex = () => {
                _createIndex(newIndex, migrantIndexName, mapping, recordType, clusterName)
                    .then(() => isAvailable(newIndex))
                    .catch((err) => {
                        if (isFatalError(err)) return Promise.reject(err);

                        const error = new TSError(err, {
                            reason: 'Failure to create index',
                            context: {
                                newIndex,
                                migrantIndexName,
                                clusterName,
                                connection,
                            },
                        });

                        logger.error(error);

                        logger.info(`Attempting to connect to elasticsearch: ${clientName}`);
                        return _createIndex(
                            newIndex,
                            migrantIndexName,
                            mapping,
                            recordType,
                            clusterName
                        )
                            .then(() => {
                                const query = { index: newIndex };
                                return indexRecovery(query);
                            })
                            .then((results) => {
                                let bool = false;
                                if (Object.keys(results).length !== 0) {
                                    const isPrimary = results[newIndex].shards.filter(
                                        (shard) => shard.primary === true
                                    );
                                    bool = isPrimary.every((shard) => shard.stage === 'DONE');
                                }
                                if (bool) {
                                    logger.info('connection to elasticsearch has been established');
                                    return isAvailable(newIndex);
                                }
                                return Promise.resolve();
                            })
                            .catch((_checkingError) => {
                                if (Date.now() > giveupAfter) {
                                    const timeoutError = new TSError(
                                        `Unable to create index ${newIndex}`
                                    );
                                    return Promise.reject(timeoutError);
                                }

                                const checkingError = new TSError(_checkingError);
                                logger.info(
                                    checkingError,
                                    `Attempting to connect to elasticsearch: ${clientName}`
                                );

                                return Promise.resolve();
                            })
                            .then(() => attemptToCreateIndex());
                    })
                    .then(() => resolve(true))
                    .catch((err) => {
                        reject(err);
                    });
            };
            attemptToCreateIndex();
        });
    }

    return {
        search,
        count,
        get: getFn,
        mget,
        index: indexFn,
        indexWithId,
        isAvailable,
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
        verifyClient,
        validateGeoParameters,
        getClientMetadata,
        isElasticsearch8,
        // The APIs below are deprecated and should be removed.
        index_exists: indexExists,
        index_create: indexCreate,
        index_refresh: indexRefresh,
        index_recovery: indexRecovery,
        getESVersion,
        isErrorRetryable
    };
}
