import {
    get, isString, toNumber,
    cloneDeep, castArray, isEmpty,
    sortKeys, parseError, TSError,
    toBoolean, isDeepEqual, isFatalError,
    isProd, pDelay
} from '@terascope/core-utils';
import {
    ESFieldType, ESTypeMapping, ClientMetadata,
    ElasticsearchDistribution, ESMapping, ClientParams,
    ClientResponse
} from '@terascope/types';
import type { Client } from '../client/index.js';
import { validateGeoParameters } from './validation.js';

const DOCUMENT_EXISTS = 409;
const TOO_MANY_REQUESTS = 429;

export function getClientVersion(client: Client): number {
    const newClientVersion = get(client, '__meta.version');
    const version = newClientVersion || get(client, 'transport._config.apiVersion', '6.5');

    if (version && isString(version)) {
        const [majorVersion] = version.split('.', 1);
        return toNumber(majorVersion);
    }

    return 6;
}

export function getClientMetadata(client: Client): ClientMetadata {
    const newClientVersion = get(client, '__meta.version');
    const version = newClientVersion || get(client, 'transport._config.apiVersion', '6.5');
    const distribution = get(client, '__meta.distribution', ElasticsearchDistribution.elasticsearch);
    // lowest Elasticsearch we run is 6.8.6
    const [majorVersion = 6, minorVersion = 8] = version.split('.').map(toNumber);

    return {
        distribution,
        version,
        majorVersion,
        minorVersion
    };
}

export function isElasticsearch8(client: Client): boolean {
    const { distribution, version: esVersion } = getClientMetadata(client);
    const parsedVersion = toNumber(esVersion.split('.', 1)[0]);

    return distribution === ElasticsearchDistribution.elasticsearch && parsedVersion === 8;
}

export function isOpensearch(client: Client): boolean {
    const { distribution } = getClientMetadata(client);
    return distribution === ElasticsearchDistribution.opensearch;
}

export function isOpensearch1(client: Client): boolean {
    const { distribution, version: esVersion } = getClientMetadata(client);
    const parsedVersion = toNumber(esVersion.split('.', 1)[0]);

    return distribution === ElasticsearchDistribution.opensearch && parsedVersion === 1;
}

export function isOpensearch2(client: Client): boolean {
    const { distribution, version: esVersion } = getClientMetadata(client);
    const parsedVersion = toNumber(esVersion.split('.', 1)[0]);

    return distribution === ElasticsearchDistribution.opensearch && parsedVersion === 2;
}
export function isOpensearch3(client: Client): boolean {
    const { distribution, version: esVersion } = getClientMetadata(client);
    const parsedVersion = toNumber(esVersion.split('.', 1)[0]);

    return distribution === ElasticsearchDistribution.opensearch && parsedVersion === 3;
}

// TODO: move this logic over to datatype
export function fixMappingRequest(
    client: Client, _params: { body: ESMapping; name?: string; index?: string }, isTemplate: boolean
): any {
    if (!_params || !_params.body) {
        throw new Error('Invalid mapping request');
    }
    const params = cloneDeep(_params);
    const defaultParams: any = {};

    const version = getClientVersion(client);

    if (params.body.template != null) {
        if (isTemplate && params.body.index_patterns == null) {
            params.body.index_patterns = castArray(params.body.template).slice();
        }
        delete params.body.template;
    }

    // we do not support v5 anymore
    if (version !== 6) {
        const mappings = params?.body?.mappings || {};
        if (!mappings.properties && mappings._doc) {
            // esV8/osV2 seem to convert properly if mapping._doc.properties or mapping.properties
            // but esV7/osV1 only seem to work w/include_type_name if properties is under "_doc"
            // along w/metadata fields so set include_type_name if _doc & ensure metadata is in _doc
            defaultParams.include_type_name = true;

            if ((version === 7 || version === 1) && defaultParams.include_type_name) {
                // move any metadata fields to _doc
                const metadataFields = ['_index', '_id', '_source', '_size', '_doc_count', '_field_names', '_ignored', '_routing', '_meta', '_tier'];
                metadataFields.forEach((f) => {
                    if (mappings[f]) {
                        mappings._doc[f] = { ...mappings._doc[f], ...mappings[f] };
                        delete mappings[f];
                    }
                });
            }
        }

        // _all deprecated in esV6, esV8 & osV2 seems to strip automatically but esV7/osV1 don't
        if (version === 7 || version === 1) {
            if (mappings.include_type_name) {
                Object.values(mappings).forEach((typeMapping) => {
                    if (typeMapping && typeMapping._all) {
                        delete typeMapping._all;
                    }
                });
            } else if (mappings._all) {
                // _all might be at root mapping level if not include_type_name
                delete mappings._all;
            }
        }
    }

    return Object.assign({}, defaultParams, params);
}

/**
 * This is the return type for {@link getFlattenedNamesAndTypes}
*/
export type FlattenProperties = Record<string, [type: ESFieldType, extra?: string]>;

/**
 * This is useful for diffing the property mappings, the keys should be
 * sorted so this can be stringified and diffed.
*/
export function getFlattenedNamesAndTypes(config: ESTypeMapping): FlattenProperties {
    const output: FlattenProperties = Object.create(null);
    for (const field of Object.keys(config).sort()) {
        const {
            type: _type, properties, ...extra
        } = config[field as keyof ESTypeMapping] as Record<string, any>;

        // if there is no type, elasticsearch returns "undefined" for the type
        // but this will cause conflicts, we should set it to "object"
        const type: ESFieldType = _type == null ? 'object' : _type;

        const extraSorted = sortKeys(extra, { deep: true });

        output[field] = isEmpty(extraSorted)
            ? [type]
            : [
                type,
                JSON.stringify(extraSorted)
            ];

        // this means the object is nested
        if (properties) {
            const nestedOutput = getFlattenedNamesAndTypes(properties);
            for (const [nestedField, nestedConfig] of Object.entries(nestedOutput)) {
                output[`${field}.${nestedField}`] = nestedConfig;
            }
        }
    }
    return output;
}

export function buildQuery(
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

export async function setupIndex(
    client: Client,
    clusterName: string,
    newIndex: string,
    migrantIndexName: string,
    mapping: Record<string, any>,
    timeout: number
): Promise<boolean> {
    // TODO: not going to touch this, needs a heavy refactor
    // this contains the behavior for teraslice to continually wait
    // until elasticsearch is available before making the store index
    try {
        await _createIndex(client, newIndex, migrantIndexName, mapping, clusterName);
        await client.isIndexAvailable(newIndex);
        return true;
    } catch (err: any) {
        if (isFatalError(err)) throw err;

        const error = new TSError(err, {
            reason: 'Failure to create index',
            context: {
                newIndex,
                migrantIndexName,
                clusterName,
            },
        });

        // logger.error(error);

        try {
            const query = { index: newIndex };
            const results = await client.indices.recoveryWithRetry(query);

            let bool = false;

            if (Object.keys(results).length !== 0) {
                const isPrimary = results[newIndex].shards.filter(
                    (shard: any) => shard.primary === true
                );
                bool = isPrimary.every((shard: any) => shard.stage === 'DONE');
            }

            if (bool) {
                // logger.info('connection to elasticsearch has been established');
                await client.isIndexAvailable(newIndex);
            }

            return true;
        } catch (checkError: any) {
            if (Date.now() > timeout) {
                const timeoutError = new TSError(
                    `Unable to create index ${newIndex}`
                );
                throw (timeoutError);
            }

            const checkingError = new TSError(checkError);
            // logger.info(
            //     checkingError,
            //     `Attempting to connect to elasticsearch: ${clientName}`
            // );

            return setupIndex(
                client,
                clusterName,
                newIndex,
                migrantIndexName,
                mapping,
                timeout
            );
        }
    }
}

async function _createIndex(
    client: Client,
    index: string,
    migrantIndexName: string,
    mapping: Record<string, any>,
    clusterName: string
) {
    const existQuery: ClientParams.IndicesExistsParams = { index };
    // @ts-expect-error
    const exists = await client.indices.existsWithRetry(existQuery);

    if (!exists) {
        // Make sure the index exists before we do anything else.
        const createQuery = {
            index,
            body: mapping,
        };

        try {
            await _sendTemplate(client, mapping, clusterName);
            return client.indices.create(createQuery);
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
            client,
            clusterName,
            index,
            migrantIndexName,
            mapping,
        );
    } catch (err) {
        throw new TSError(err, {
            reason: `error while migrating index: ${existQuery.index}`,
            fatalError: true,
        });
    }
}

async function _checkAndUpdateMapping(
    client: Client,
    clusterName: string,
    index: string,
    migrantIndexName: string,
    mapping: Record<string, any>,
) {
    if (index === migrantIndexName || migrantIndexName === null) {
        const error = new TSError(
            `index and migrant index names are the same: ${index}, please update the appropriate package.json version`
        );
        return Promise.reject(error);
    }

    const query = { index };
    const results = await _verifyMapping(client, query, mapping);

    if (results.areEqual) return true;
    // For state and analytics, we will not _migrate, but will post template so that
    // the next index will have them
    if (mapping.template) {
        return _sendTemplate(client, mapping, clusterName);
    }

    return _migrate(client, index, migrantIndexName, mapping, clusterName);
}

async function _sendTemplate(
    client: Client,
    mapping: Record<string, any>,
    clusterName: string
) {
    if (mapping.template) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const name = `${clusterName}_template`;
        // setting template name to reflect current teraslice instance name to help prevent
        // conflicts with differing versions of teraslice with same elastic db
        if (!mapping.template.match(clusterName)) {
            mapping.template = `${clusterName}${mapping.template}`;
        }
        // TODO: this used to fix Template, its should be made right elsewhere;

        // TODO: need to wrap body here? and put name on it?
        return client.indices.putTemplate(mapping as any);
    }
    // TODO: this seems really silly
    return Promise.resolve(true);
}

async function _verifyMapping(
    client: Client,
    query: Record<string, any>,
    configMapping: Record<string, any>,
) {
    const params = Object.assign({}, query);

    try {
        // TODO: check if retry here?
        const mapping = await client.indices.getMapping(params) as Record<string, any>;
        return _areSameMappings(configMapping, mapping);
    } catch (err) {
        throw new TSError(err, {
            reason: `could not get mapping for query ${JSON.stringify(params)}`,
        });
    }
}

function _areSameMappings(
    configMapping: Record<string, any>,
    mapping: Record<string, any>,
) {
    const sysMapping: Record<string, any> = {};
    const index = Object.keys(mapping)[0];
    sysMapping[index] = { mappings: configMapping.mappings };

    const { dynamic } = mapping[index].mappings;
    // elasticsearch for some reason converts false to 'false' for dynamic key
    if (dynamic !== undefined) {
        mapping[index].mappings.dynamic = toBoolean(dynamic);
    }
    const areEqual = isDeepEqual(mapping, sysMapping);

    return { areEqual };
}

async function _migrate(
    client: Client,
    index: string,
    migrantIndexName: string,
    mapping: Record<string, any>,
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
            client.countWithRetry({ index }),
            // the empty string is not great, should maybe separate index creation logic
            _createIndex(client, migrantIndexName, '', mapping, clusterName),
        ]);

        await client.reindex(reindexQuery);

        const newDocCount = await client.countWithRetry({ index: migrantIndexName });

        if (docCount !== newDocCount) {
            const errMsg = `reindex error, index: ${migrantIndexName} only has ${docCount} docs, expected ${docCount} from index: ${index}`;
            throw new Error(errMsg);
        }
    } catch (err: any) {
        throw new TSError(
            err,
            {
                reason: `could not reindex for query ${JSON.stringify(reindexQuery)}`,
            }
        );
    }

    try {
        // With retry?
        await client.indices.delete({ index });
        // we have no client method for this
        // await client.indices.pu('putAlias', { index: migrantIndexName, name: index });
    } catch (err: any) {
        const error = new TSError(err, {
            reason: `could not put alias for index: ${migrantIndexName}, name: ${index}`,
        });
        throw error;
    }
}

/**
     * This is used for improved bulk sending function
    */
// export interface BulkRecord {
//     action: AnyBulkAction;
//     // this is definitely wrong, record was set to UpdateConfig which had no definition
//     data?: Record<string, any> | DataEntity;
// }

export async function _bulkSend(
    client: Client,
    actionRecords: any[],
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

        // if data is specified return both
        return record.data
            ? [{
                ...record.action,
            },
            record.data]
            : [{
                ...record.action,
            }];
    });
    // @ts-expect-error
    const response = await client.bulk('bulk', { body }) as any;
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

    //     if (error && config._dead_letter_action !== 'kafka_dead_letter') {

    if (error) {
        throw new Error(`bulk send error: ${reason}`);
    }

    if (retry.length === 0) {
        return previousCount + successful;
    }

    return _handleRetries(client, retry, previousCount + successful, previousRetryDelay);
}

function _filterRetryRecords(
    actionRecords: any[],
    result: any
) {
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

                // if (config._dead_letter_action === 'kafka_dead_letter') {
                //     // @ts-expect-error
                //     actionRecords[i].data.setMetadata('_bulk_sender_rejection', reason);
                //     continue;
                // }

                break;
            }
        } else if (item.status == null || item.status < 400) {
            successful++;
        }
    }

    if (nonRetriableError) {
        // if dlq active still attempt the retries
        // const retryOnError = config._dead_letter_action === 'kafka_dead_letter' ? retry : [];
        const retryOnError = retry;

        return {
            retry: retryOnError, successful, error: true, reason
        };
    }

    return { retry, successful, error: false };
}

async function _handleRetries(
    client: Client,
    retry: any[],
    affectedCount: number,
    previousRetryDelay: number
) {
    //  warning();
    await pDelay(200);
    // const nextRetryDelay = await _awaitRetry(previousRetryDelay);
    // return _bulkSend(client, retry, affectedCount, nextRetryDelay);
    return _bulkSend(client, retry, affectedCount, 200);
}

export function convertToDocs<T extends Record<string, any>>(
    input: ClientResponse.SearchResponse<T>
) {
    return input.hits.hits.map((record) => record._source) as T[];
}
