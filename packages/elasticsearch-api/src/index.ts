import {
    isTest, TSError, isFatalError,
    parseError, getBackoffDelay, isRetryableError,
    get, toNumber, isString, isSimpleObject,
    castArray, flatten, toBoolean,
    uniq, random, cloneDeep, DataEntity,
    isDeepEqual, getTypeOf, isProd, Logger
} from '@terascope/utils';
import { Client as OpenClient } from '@terascope/opensearch-client';
import {
    ElasticsearchDistribution, SearchResult, ClientParams,
    ClientResponse,
} from '@terascope/types';
// @ts-expect-error  TODO: do we still need this after getting rid of es6?
import('setimmediate');

const DOCUMENT_EXISTS = 409;
const TOO_MANY_REQUESTS = 429;

// TODO: need a more authoritative interface here
export interface Config {
    index?: string;
    full_response?: boolean;
    connection?: string;
    _dead_letter_action?: string;
}

/**
     * This is used for improved bulk sending function
    */
export interface BulkRecord {
    action: AnyBulkAction;
    // this is definitely wrong, record was set to UpdateConfig which had no definition
    data?: Record<string, any> | DataEntity;
}

/**
     * This is used for improved bulk sending function
    */
export interface AnyBulkAction {
    update?: Partial<BulkActionMetadata>;
    index?: Partial<BulkActionMetadata>;
    create?: Partial<BulkActionMetadata>;
    delete?: Partial<BulkActionMetadata>;
}

/**
     * This is used for improved bulk sending function
    */
export interface BulkActionMetadata {
    _index: string;
    _type: string;
    _id: string | number;
    retry_on_conflict?: number;
}

// Module to manage persistence in Elasticsearch.
// All functions in this module return promises that must be resolved to get the final result.
export default function elasticsearchApi(
    client: OpenClient,
    logger: Logger,
    _opConfig?: Config | undefined
) {
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

    async function count(query: ClientParams.CountParams) {
        const countQuery = {
            ...query,
            size: 0
        } as ClientParams.SearchParams;
        const response = await _searchES(countQuery);

        const data = get(response, 'hits.total.value', get(response, 'hits.total'));

        return data as number;
    }

    function convertDocToDataEntity(doc: SearchResult<Record<string, any>>) {
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
            _type: doc._type,
            _version: doc._version,
            _seq_no: doc._seq_no,
            _primary_term: doc._primary_term
        };

        return DataEntity.make<Record<string, any>>(
            doc._source as Record<string, any>,
            metadata
        );
    }

    async function search(
        query: ClientParams.SearchParams
    ): Promise<ClientResponse.SearchResponse | any[]> {
        const {
            // @ts-expect-error this can be removed when es6 is not supported
            _sourceInclude, _source_includes: oldSourIncludes,
            // @ts-expect-error
            _sourceExclude, _source_excludes: oldSourExcludes,
            ...safeQuery
        } = query;

        const sourceIncludes = _sourceInclude || oldSourIncludes;
        const sourceExcludes = _sourceExclude || oldSourExcludes;

        if (sourceIncludes) {
            // @ts-expect-error
            safeQuery._source_includes = sourceIncludes;
        }

        if (sourceExcludes) {
            // @ts-expect-error
            safeQuery._source_excludes = sourceExcludes;
        }

        const data = await _searchES(safeQuery);

        if (config.full_response) {
            return data;
        }

        if (!data.hits.hits) return [] as unknown as ClientResponse.SearchResponse;

        return data.hits.hits.map(
            convertDocToDataEntity
        ) as unknown as ClientResponse.SearchResponse;
    }

    function _makeRequest(
        clientBase: Record<string, any>,
        endpoint: string,
        query: Record<string, any>,
        fnNamePrefix?: string
    ) {
        return new Promise((resolve, reject) => {
            const fnName = `${fnNamePrefix || ''}->${endpoint}()`;
            const errHandler = _errorHandler(_runRequest, query, reject, fnName);

            function _runRequest() {
                clientBase[endpoint](query)
                    .then((rawResponse: ClientResponse.SearchResponse) => {
                        const response = get(rawResponse, 'body', rawResponse);
                        resolve(response);
                    })
                    .catch(errHandler);
            }

            waitForClient(() => _runRequest(), reject);
        });
    }

    async function _clientRequest(endpoint: string, query: Record<string, any>) {
        return _makeRequest(client, endpoint, query);
    }

    async function _clientIndicesRequest(endpoint: string, query: Record<string, any>) {
        return _makeRequest(client.indices, endpoint, query, 'indices');
    }

    async function mget(query: ClientParams.MGetParams, fullResponse = false) {
        const results: any = await _clientRequest('mget', _adjustTypeForEs7(query));

        if (fullResponse) return results;
        return results.docs
            .filter((doc: any) => doc.found)
            .map(convertDocToDataEntity);
    }

    async function getFn(query: ClientParams.GetParams, fullResponse = false): Promise<any> {
        if (fullResponse) {
            return _clientRequest('get', query);
        }
        const records = await _clientRequest('get', query) as SearchResult;

        return convertDocToDataEntity(records);
    }

    async function indexFn(query: ClientParams.IndexParams) {
        return _clientRequest('index', _adjustTypeForEs7(query));
    }

    async function indexWithId(query: ClientParams.IndexParams) {
        return _clientRequest('index', _adjustTypeForEs7(query)).then(() => query.body);
    }

    async function create(query: ClientParams.CreateParams) {
        return _clientRequest('create', _adjustTypeForEs7(query)).then(() => query.body);
    }

    async function update(query: ClientParams.UpdateParams): Promise<any> {
        // TODO this does not seem right
        await _clientRequest('update', _adjustTypeForEs7(query));
        // @ts-expect-error
        return query.body.doc;
    }

    async function remove(
        query: ClientParams.DeleteParams
    ): Promise<ClientResponse.DeleteResponse> {
        const result = await _clientRequest('delete', _adjustTypeForEs7(query)) as any;
        return result.found;
    }

    async function indexExists(query: ClientParams.IndicesExistsParams): Promise<boolean> {
        return _clientIndicesRequest('exists', query) as unknown as boolean;
    }

    async function indexCreate(query: ClientParams.IndicesCreateParams): Promise<any> {
        const params = _fixMappingRequest(query, false);
        return _clientIndicesRequest('create', params);
    }

    async function indexRefresh(query: ClientParams.IndicesRefreshParams): Promise<any> {
        return _clientIndicesRequest('refresh', query);
    }

    async function indexRecovery(query: ClientParams.IndicesRefreshParams): Promise<any> {
        return _clientIndicesRequest('recovery', query);
    }

    async function nodeInfo() {
        return client.nodes.info();
    }

    async function nodeStats() {
        return client.nodes.stats();
    }

    function _verifyIndex(indexObj: Record<string, any>, name: string) {
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

    async function version() {
        const wildCardRegex = /\*/g;
        // @ts-expect-error this expects index to exist
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
                const resultIndex = _verifyIndex(settingsData, config.index as string);

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

    async function putTemplate(template: Record<string, any>, name: string): Promise<any> {
        const params = _fixMappingRequest({ body: template, name }, true);
        return _clientIndicesRequest('putTemplate', params);
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
    function _filterRetryRecords(actionRecords: BulkRecord[], result: any) {
        const retry = [];
        const { items } = result;

        let nonRetriableError = false;
        let reason = '';
        let successful = 0;

        for (let i = 0; i < items.length; i++) {
            // key could either be create or delete etc, just want the actual data at the value spot
            const item = Object.values(items[i])[0] as any;
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
                        // @ts-expect-error
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

    function getFirstKey(obj: Record<string, any>) {
        return Object.keys(obj)[0];
    }

    /**
     * @param data {Array<{ action: data }>}
     * @returns {Promise<number>}
    */
    async function _bulkSend(
        actionRecords: BulkRecord[],
        previousCount = 0,
        previousRetryDelay = 0
        // TODO: why are we returning a number?
    ): Promise<number> {
        const body = actionRecords.flatMap((record: Record<string, any>, index) => {
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

        const response = await _clientRequest('bulk', { body }) as any;
        const results = response.body ? response.body : response;

        if (!results.errors) {
            return results.items.reduce((c: number, item: Record<string, any>) => {
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

    async function _handleRetries(
        retry: BulkRecord[],
        affectedCount: number,
        previousRetryDelay: number
    ) {
        warning();

        const nextRetryDelay = await _awaitRetry(previousRetryDelay);
        return _bulkSend(retry, affectedCount, nextRetryDelay);
    }

    /**
     * The new and improved bulk send with proper retry support
     *
     * @returns {Promise<number>} the number of affected rows
    */
    async function bulkSend(data: BulkRecord[] | Record<string, any>[]) {
        if (!Array.isArray(data)) {
            throw new Error(`Expected bulkSend to receive an array, got ${data} (${getTypeOf(data)})`);
        }
        return _bulkSend(data as any);
    }

    function _warn(warnLogger: Logger, msg: string) {
        let _lastTime: number | null = null;

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

    function validateGeoParameters(opConfig: Record<string, any>) {
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

    // TODO: might need to relocate the elasticsearch op type somewhere to be shared here
    function geoSearch(opConfig: Record<string, any>) {
        let isGeoSort = false;
        // TODO: needs a more distinct type for geo search components
        const queryResults: Record<string, any> = {};
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

        function createGeoSortQuery(location: string[]) {
            // TODO: this needs a better type
            const sortedSearch: Record<string, any> = { _geo_distance: {} };
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

            const searchQuery: Record<string, any> = {
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

            // are these two tied together?
            if (isGeoSort && parsedGeoSortPoint) {
                queryResults.sort = createGeoSortQuery(parsedGeoSortPoint);
            }

            return queryResults;
        }

        if (geoDistance) {
            const location = createGeoPoint(geoPoint);
            const searchQuery: Record<string, any> = {
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
            // TODO: need better geo parsing
            queryResults.sort = createGeoSortQuery(locationPoints);
        }

        return queryResults;
    }

    function createGeoPoint(point: string) {
        const pieces = point.split(',');
        return pieces;
    }

    // TODO: need type contract between this and elasticsearch assets
    function _buildRangeQuery(opConfig: Record<string, any>, msg: Record<string, any>) {
        const body: Record<string, any> = {
            query: {
                bool: {
                    must: [],
                },
            },
        };
        // is a range type query
        if (msg.start && msg.end) {
            const dateObj: Record<string, any> = {};
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

    function buildQuery(
        opConfig: Record<string, any>,
        msg: Record<string, any>
    ): ClientParams.SearchParams {
        const query: Record<string, any> = {
            index: opConfig.index,
            size: msg.count,
            body: _buildRangeQuery(opConfig, msg),
        };

        if (opConfig.fields) {
            query._source = opConfig.fields;
        }
        return query;
    }

    async function _searchES(
        query: ClientParams.SearchParams
    ): Promise<ClientResponse.SearchResponse> {
        return new Promise((resolve, reject) => {
            const errHandler = _errorHandler(_performSearch, query, reject, '->search()');
            const retry = _retryFn(_performSearch, query, reject);

            function _performSearch(queryParam: Record<string, any>) {
                client
                    .search(queryParam)
                    .then((data: Record<string, any>) => {
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

    function _adjustTypeForEs7(query: Record<string, any>) {
        if (!isElasticsearch6()) {
            if (Array.isArray(query)) {
                return _removeTypeFromBulkRequest(query);
            }
            delete query.type;
        }

        return query;
    }

    function _removeTypeFromBulkRequest(query: Record<string, any>[]) {
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
    // TODO: this is not even being called in bulk calls
    function _getBulkMetaData(queryItem: any) {
        // bulk actions are index, create, delete, and update
        return queryItem.index
            || queryItem.create
            || queryItem.delete
            || queryItem.update;
    }

    function _hasBulkMetaDataProps(bulkMetaData: any) {
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
     * TODO: this is not ok, relying on esoteric promise behavior and being checked on every call
    */
    async function waitForClient(resolve: any, reject: any) {
        // @ts-expect-error
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
                // @ts-expect-error

                clearInterval(intervalId);
                resolve(elapsed);
                return true;
            } catch (err) {
                // @ts-expect-error
                clearInterval(intervalId);
                reject(err);
                return true;
            }
        }
    }

    function _retryFn(
        fn: any,
        data: any,
        reject: any
    ) {
        let delay = 0;

        return (_data?: any) => {
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
    async function _awaitRetry(previousDelay = 0): Promise<number> {
        return new Promise((resolve, reject) => {
            waitForClient((elapsed: number) => {
                const delay = getBackoffDelay(previousDelay, 2, retryLimit, retryStart);

                let timeoutMs = delay - elapsed;
                if (timeoutMs < 1) timeoutMs = 1;
                // TODO: this is super confusing
                setTimeout(resolve, timeoutMs, delay);
            }, reject);
        });
    }

    function isConnectionErrorMessage(err: Error) {
        const msg = get(err, 'message', '');
        return msg.includes('No Living connections') || msg.includes('ECONNREFUSED');
    }

    function isErrorRetryable(err: Error) {
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

    function _errorHandler(
        fn: any,
        data: any,
        reject: (args?: any) => void,
        fnName = '->unknown()'
    ) {
        const retry = _retryFn(fn, data, reject);

        return function _errorHandlerFn(err: Error) {
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

    async function isAvailable(index: string, recordType?: string) {
        const query: ClientParams.SearchParams = {
            index,
            q: '',
            size: 0,
            // @ts-expect-error TODO: should be a number, check what its really doing
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

        const alive = get(client, 'transport.connectionPool._conns.alive') as undefined | any[];
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

    function isElasticsearch6() {
        const { distribution, majorVersion } = getClientMetadata();
        return distribution === ElasticsearchDistribution.elasticsearch && majorVersion === 6;
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

    function _fixMappingRequest(_params: Record<string, any>, isTemplate: boolean) {
        if (!_params || !_params.body) {
            throw new Error('Invalid mapping request');
        }
        const params = cloneDeep(_params);
        const defaultParams: Record<string, any> = {};

        if (params.body.template != null) {
            if (isTemplate && params.body.index_patterns == null) {
                params.body.index_patterns = castArray(params.body.template).slice();
            }
            delete params.body.template;
        }

        if (!isElasticsearch6()) {
            const typeMappings = get(params.body, 'mappings', {}) as Record<string, any>;
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

        if (isElasticsearch8() || isOpensearch2() || isOpensearch3()) {
            delete defaultParams.includeTypeName;
        }

        return Object.assign({}, defaultParams, params);
    }

    async function _migrate(
        index: string,
        migrantIndexName: string,
        mapping: Record<string, any>,
        recordType: string,
        clusterName: string
    ) {
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

        try {
            const [docCount] = await Promise.all([
                count({ index }),
                // the empty string is not great, should maybe separate index creation logic
                _createIndex(migrantIndexName, '', mapping, recordType, clusterName),
            ]);

            await _clientRequest('reindex', reindexQuery);

            const newDocCount = await count({ index: migrantIndexName });

            if (docCount !== newDocCount) {
                const errMsg = `reindex error, index: ${migrantIndexName} only has ${docCount} docs, expected ${docCount} from index: ${index}`;
                throw new Error(errMsg);
            }
        } catch (err: any) {
            throw new TSError(
                err,
                {
                    reason: `could not reindex for query ${JSON.stringify(reindexQuery)}`,
                    context: { connection },
                }
            );
        }

        try {
            await _clientIndicesRequest('delete', { index });
            await _clientIndicesRequest('putAlias', { index: migrantIndexName, name: index });
        } catch (err: any) {
            const error = new TSError(err, {
                reason: `could not put alias for index: ${migrantIndexName}, name: ${index}`,
            });
            throw error;
        }
    }

    async function _createIndex(
        index: string,
        migrantIndexName: string,
        mapping: Record<string, any>,
        recordType: string,
        clusterName: string
    ) {
        const existQuery: ClientParams.IndicesExistsParams = { index };

        const exists = await indexExists(existQuery);

        if (!exists) {
            // Make sure the index exists before we do anything else.
            const createQuery = {
                index,
                body: mapping,
            };

            try {
                await _sendTemplate(mapping, recordType, clusterName);
                return indexCreate(createQuery);
            } catch (err: any) {
                // It's not really an error if it's just that the index is already there
                const errStr = parseError(err, true);
                if (!errStr.includes('already_exists_exception')) {
                    throw new TSError(err, {
                        reason: `Could not create index: ${index}`,
                    });
                }
            }
        }

        try {
            await _checkAndUpdateMapping(
                clusterName,
                index,
                migrantIndexName,
                mapping,
                recordType
            );
        } catch (err) {
            throw new TSError(err, {
                reason: `error while migrating index: ${existQuery.index}`,
                fatalError: true,
            });
        }
    }

    async function _verifyMapping(
        query: Record<string, any>,
        configMapping: Record<string, any>,
        recordType: string
    ) {
        const params = Object.assign({}, query);

        if (!isElasticsearch6()) {
            if (recordType) {
                params.includeTypeName = true;
            }
        }

        try {
            const mapping = await _clientIndicesRequest('getMapping', params) as Record<string, any>;
            return _areSameMappings(configMapping, mapping, recordType);
        } catch (err) {
            throw new TSError(err, {
                reason: `could not get mapping for query ${JSON.stringify(params)}`,
            });
        }
    }

    function _areSameMappings(
        configMapping: Record<string, any>,
        mapping: Record<string, any>,
        recordType: string
    ) {
        const sysMapping: Record<string, any> = {};
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

    async function _checkAndUpdateMapping(
        clusterName: string,
        index: string,
        migrantIndexName: string,
        mapping: Record<string, any>,
        recordType: string
    ) {
        if (index === migrantIndexName || migrantIndexName === null) {
            const error = new TSError(
                `index and migrant index names are the same: ${index}, please update the appropriate package.json version`
            );
            return Promise.reject(error);
        }

        const query = { index };
        const results = await _verifyMapping(query, mapping, recordType);

        if (results.areEqual) return true;
        // For state and analytics, we will not _migrate, but will post template so that
        // the next index will have them
        if (recordType === 'state' || recordType === 'analytics') {
            return _sendTemplate(mapping, recordType, clusterName);
        }

        return _migrate(index, migrantIndexName, mapping, recordType, clusterName);
    }

    async function _sendTemplate(
        mapping: Record<string, any>,
        recordType: string,
        clusterName: string
    ) {
        if (mapping.template) {
            const name = `${clusterName}_${recordType}_template`;
            // setting template name to reflect current teraslice instance name to help prevent
            // conflicts with differing versions of teraslice with same elastic db
            if (!mapping.template.match(clusterName)) {
                mapping.template = `${clusterName}${mapping.template}`;
            }
            return putTemplate(mapping, name);
        }
        // TODO: this seems really silly
        return Promise.resolve(true);
    }

    async function indexSetup(
        clusterName: string,
        newIndex: string,
        migrantIndexName: string,
        mapping: Record<string, any>,
        recordType: string,
        clientName: string,
        _time?: number
    ): Promise<boolean> {
        const giveupAfter = Date.now() + (_time || 10000);

        return new Promise((resolve, reject) => {
            // TODO: not going to touch this, needs a heavy refactor
            // this contains the behavior for teraslice to continually wait
            // until elasticsearch is available before making the store index
            const attemptToCreateIndex = () => {
                _createIndex(newIndex, migrantIndexName, mapping, recordType, clusterName)
                    .then(() => isAvailable(newIndex))
                    .catch((err: Error) => {
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
                            .then((results: any) => {
                                let bool = false;
                                if (Object.keys(results).length !== 0) {
                                    const isPrimary = results[newIndex].shards.filter(
                                        (shard: any) => shard.primary === true
                                    );
                                    bool = isPrimary.every((shard: any) => shard.stage === 'DONE');
                                }
                                if (bool) {
                                    logger.info('connection to elasticsearch has been established');
                                    return isAvailable(newIndex);
                                }
                                return Promise.resolve();
                            })
                            .catch((_checkingError: Error) => {
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
                    .catch((err: Error) => {
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
        isElasticsearch6,
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

export type Client = ReturnType<typeof elasticsearchApi>;
