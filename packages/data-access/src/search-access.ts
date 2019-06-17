import * as es from 'elasticsearch';
import * as ts from '@terascope/utils';
import * as x from 'xlucene-evaluator';
import { SpaceSearchConfig } from './models';
import * as i from './interfaces';
import * as t from '@terascope/data-types';

const _logger = ts.debugLogger('search-access');

/**
 * Using a DataAccess ACL, limit queries to
 * specific fields and records
 */
export class SearchAccess {
    config: i.DataAccessConfig;
    spaceConfig: SpaceSearchConfig;
    private _queryAccess: x.QueryAccess;
    private _logger: ts.Logger;

    constructor(config: i.DataAccessConfig, logger: ts.Logger = _logger) {
        this.config = config;
        this.spaceConfig = config.config as SpaceSearchConfig;
        if (ts.isEmpty(this.spaceConfig) || !this.spaceConfig.index) {
            throw new ts.TSError('Search is not configured correctly for search');
        }

        const typeConfig = this.config.data_type.config || { fields: {}, version: t.LATEST_VERSION };
        const types = new t.DataType(typeConfig);
        this._logger = logger;
        this._queryAccess = new x.QueryAccess(
            {
                excludes: this.config.view.excludes,
                includes: this.config.view.includes,
                constraint: this.config.view.constraint,
                prevent_prefix_wildcard: this.config.view.prevent_prefix_wildcard,
                allow_empty_queries: true,
                type_config: types.toXlucene(),
            },
            this._logger
        );
    }

    /**
     * Converts a restricted xlucene query to an elasticsearch search query
     */
    restrictSearchQuery(query?: string, params?: es.SearchParams): es.SearchParams {
        return this._queryAccess.restrictSearchQuery(query || '', params);
    }

    /**
     * Safely search a space given an elasticsearch client and a valid query
     */
    async performSearch(client: es.Client, query: i.InputQuery) {
        const params = this.getSearchParams(query);

        let esQuery: es.SearchParams;
        try {
            esQuery = this.restrictSearchQuery(params.q, params);
        } catch (err) {
            throw new ts.TSError(err, {
                reason: 'Query restricted',
                context: {
                    config: this.spaceConfig,
                    query,
                    safe: true,
                },
            });
        }

        if (ts.isTest) this._logger.debug(esQuery, 'searching...');

        let response: any = {};
        try {
            response = await client.search(esQuery);
        } catch (err) {
            response.error = err;
        }

        if (ts.isTest) this._logger.trace(response, 'got response...');

        return this.getSearchResponse(response, query, params);
    }

    /**
     * Validate and get elasticsearch search request parameters
     *
     * @private
     */
    getSearchParams(query: i.InputQuery): es.SearchParams {
        const typeConfig = this.config.data_type.config || {
            version: t.LATEST_VERSION,
            fields: {},
        };
        const params: es.SearchParams = {
            body: {},
        };

        const q: string = ts.get(query, 'q', '');
        if (!q && this.spaceConfig.require_query) {
            throw new ts.TSError(...validationErr('q', 'must not be empty', query));
        }

        const size = ts.toInteger(ts.get(query, 'size', 100));
        if (size === false) {
            throw new ts.TSError(...validationErr('size', 'must be a valid number', query));
        }

        const maxQuerySize: number = ts.toInteger(this.spaceConfig.max_query_size) || 100000;
        if (size > maxQuerySize) {
            throw new ts.TSError(...validationErr('size', `must be less than ${maxQuerySize}`, query));
        }

        const start = ts.get(query, 'start');
        if (start) {
            if (!ts.isNumber(start)) {
                throw new ts.TSError(...validationErr('start', 'must be a valid number', query));
            }
        }

        let sort = ts.get(query, 'sort');
        if (sort && this.spaceConfig.sort_enabled) {
            if (!ts.isString(sort)) {
                throw new ts.TSError(...validationErr('sort', 'must be a valid string', query));
            }

            let [field, direction = 'asc'] = sort.split(':');
            field = ts.trimAndToLower(field);
            direction = ts.trimAndToLower(direction);

            const dateFields: string[] = [];
            for (const [key, config] of Object.entries(typeConfig.fields)) {
                if (config.type === 'Date') {
                    dateFields.push(key);
                }
            }

            if (this.spaceConfig.sort_dates_only && !dateFields.includes(field)) {
                throw new ts.TSError(...validationErr('sort', 'sorting is currently only available for date fields', query));
            }

            if (!field || !direction || !['asc', 'desc'].includes(direction)) {
                throw new ts.TSError(...validationErr('sort', 'must be field_name:asc or field_name:desc', query));
            }

            sort = [field, direction].join(':');
        }

        if (!sort && this.spaceConfig.sort_default) {
            sort = this.spaceConfig.sort_default;
        }

        const fields = ts.get(query, 'fields');
        if (fields) {
            params._sourceInclude = ts.uniq(ts.parseList(fields).map(s => s.toLowerCase()));
        }

        const geoField = this.spaceConfig.default_geo_field;

        if (geoField) {
            const geoSortPoint = ts.get(query, 'geo_sort_point');
            const geoSortOrder = ts.get(query, 'geo_sort_order', 'asc');
            const geoSortUnit = ts.get(query, 'geo_sort_unit', 'm');

            // add geo sort query
            if (geoSortOrder && geoSortUnit && geoSortPoint) {
                if (!x.GEO_DISTANCE_UNITS[geoSortUnit]) {
                    throw new ts.TSError(...validationErr('geo_sort_unit', 'must be one of "mi", "yd", "ft", "km" or "m"', query));
                }

                params.body.sort = getGeoSort(geoField, geoSortPoint, geoSortOrder, geoSortUnit);
            }
        }

        params.q = q;
        params.size = size;
        params.from = ts.toInteger(start) || 0;
        params.sort = sort;
        params.index = this._getIndex(query, this.spaceConfig);
        params.ignoreUnavailable = true;
        return ts.withoutNil(params);
    }

    /**
     * Format the results or error from the performSearch
     */
    getSearchResponse(response: es.SearchResponse<any>, query: i.InputQuery, params: es.SearchParams) {
        // I don't think this property actually exists
        const error = ts.get(response, 'error');
        if (error) {
            throw new ts.TSError(error, {
                context: {
                    config: this.spaceConfig,
                    query,
                    safe: false,
                },
            });
        }

        const totalShards = ts.get(response, '_shards.total', 0);
        if (!totalShards) {
            throw new ts.TSError('No results returned from query', {
                statusCode: 502,
                context: {
                    config: this.spaceConfig,
                    query,
                    safe: true,
                },
            });
        }

        let results;
        const total = response.hits.total;
        let returning = total;

        if (this.spaceConfig.preserve_index_name) {
            results = response.hits.hits.map(data => {
                const doc = data._source;
                doc._index = data._index;
                return doc;
            });
        } else {
            results = response.hits.hits.map(data => data._source);
        }

        let info = `${response.hits.total} results found.`;
        if (params.size && response.hits.total > params.size) {
            returning = params.size;
            info += ` Returning ${returning}.`;
        }

        if (ts.get(query, 'sort') && !this.spaceConfig.sort_enabled) {
            info += ' No sorting available.';
        }

        return {
            info,
            total,
            returning,
            results,
        };
    }

    private _getIndex(query: i.InputQuery, config: SpaceSearchConfig): string {
        if (!query.history) return config.index;

        const prefix = config.history_prefix;
        if (!config.enable_history || !prefix) {
            throw new ts.TSError('History is not supported for query', {
                statusCode: 422,
                context: {
                    safe: true,
                },
            });
        }

        let start = 0;
        if (query.start) start = +query.start;

        const days = +query.history;
        if (Number.isNaN(days) || Number.isNaN(start)) {
            throw new ts.TSError('History specification must be numeric.', {
                context: {
                    safe: true,
                },
            });
        }

        if (days < 0 || start < 0) {
            throw new ts.TSError('History specification must be a positive number.', {
                context: {
                    safe: true,
                },
            });
        }

        if (days < 0 || start < 0) {
            throw new ts.TSError('History is not available beyond 90 days.', {
                context: {
                    safe: true,
                },
            });
        }

        return generateHistoryIndexes(days, start, prefix);
    }
}

function validationErr(param: keyof i.InputQuery, msg: string, query: i.InputQuery): [string, ts.TSErrorConfig] {
    const given = ts.toString(ts.get(query, param));
    return [
        `Invalid ${param} parameter, ${msg}, was given: "${given}"`,
        {
            statusCode: 422,
            context: {
                safe: true,
                query,
            },
        },
    ];
}

function getGeoSort(field: string, point: string, order: i.SortOrder, unit: string): i.GeoSortQuery {
    const [lon, lat] = x.parseGeoPoint(point);

    const sort = { _geo_distance: {} } as i.GeoSortQuery;
    sort._geo_distance[field] = { lat, lon };

    sort._geo_distance.order = order;
    sort._geo_distance.unit = unit;
    return sort;
}

/*
 * Generates a list of indexes to search based off the API history parameters.
 *
 * Taken from https://github.com/terascope/teraserver/blob/c13f34b9097338051f45b0d9a2b078b406fce389/lib/search.js#L518-L539
 */
function generateHistoryIndexes(days: number, start: number, prefix: string) {
    let result = '';
    const _prefix = prefix.charAt(prefix.length - 1) === '-' ? prefix : `${prefix}-`;

    for (let index = start; index < start + days; index += 1) {
        const date = new Date();
        date.setDate(date.getDate() - index);

        // example dateStr => logscope-2016.11.11*
        const dateStr = date
            .toISOString()
            .slice(0, 10)
            .replace(/-/gi, '.');

        if (result) {
            result += `,${_prefix}${dateStr}*`;
        } else {
            result = `${_prefix + dateStr}*`;
        }
    }

    return result;
}
