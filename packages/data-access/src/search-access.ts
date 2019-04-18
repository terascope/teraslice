import * as es from 'elasticsearch';
import * as ts from '@terascope/utils';
import * as x from 'xlucene-evaluator';
import * as i from './interfaces';

const _logger = ts.debugLogger('search-access');

/**
 * Using a DataAccess ACL, limit queries to
 * specific fields and records
*/
export class SearchAccess {
    config: i.DataAccessConfig;
    private _queryAccess: x.QueryAccess;
    private _logger: ts.Logger;

    constructor(config: i.DataAccessConfig, logger: ts.Logger = _logger) {
        if (!config.search_config || ts.isEmpty(config.search_config) || !config.search_config.index) {
            throw new ts.TSError('Search is not configured correctly for search');
        }

        this.config = config;

        this._logger = logger;
        this._queryAccess = new x.QueryAccess({
            excludes: this.config.view.excludes,
            includes: this.config.view.includes,
            constraint: this.config.view.constraint,
            prevent_prefix_wildcard: this.config.view.prevent_prefix_wildcard,
            type_config: this.config.data_type.type_config,
        }, this._logger);
    }

    /**
     * Converts a restricted xlucene query to an elasticsearch search query
    */
    restrictSearchQuery(query: string = '*', params?: es.SearchParams): es.SearchParams {
        return this._queryAccess.restrictSearchQuery(query, params);
    }

    async performSearch(client: es.Client, query: i.InputQuery) {
        const params = this.getSearchParams(query);

        let esQuery: es.SearchParams;
        try {
            esQuery = this.restrictSearchQuery(params.q, params);
        } catch (err) {
            throw new ts.TSError(err, {
                reason: 'Query restricted',
                context: {
                    config: this.config.search_config,
                    query,
                    safe: true
                }
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

    getSearchParams(query: i.InputQuery): es.SearchParams {
        const config = this.config.search_config!;
        const typeConfig = this.config.data_type.type_config || {};

        const params: es.SearchParams = {
            body: {}
        };

        const q: string = ts.get(query, 'q', '');
        if (!q && config.require_query) {
            throw new ts.TSError(...validationErr('q', 'must not be empty', query));
        }

        const size = ts.toInteger(ts.get(query, 'size', 100));
        if (size === false) {
            throw new ts.TSError(...validationErr('size', 'must be a valid number', query));
        }

        const maxQuerySize: number = ts.toInteger(config.max_query_size) || 10000;
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
        if (sort && config.sort_enabled) {
            if (!ts.isString(sort)) {
                throw new ts.TSError(...validationErr('sort', 'must be a valid string', query));
            }

            let [field, direction = 'asc'] = sort.split(':');
            field = ts.trimAndToLower(field);
            direction = ts.trimAndToLower(direction);

            const dateFields: string[] = [];
            for (const [key, val] of Object.entries(typeConfig)) {
                if (val === 'date') {
                    dateFields.push(key);
                }
            }

            if (config.sort_dates_only && !dateFields.includes(field)) {
                throw new ts.TSError(...validationErr('sort', 'sorting is currently only available for date fields', query));
            }

            if (!field || !direction || !['asc', 'desc'].includes(direction)) {
                throw new ts.TSError(...validationErr('sort', 'must be field_name:asc or field_name:desc', query));
            }

            sort = [field, direction].join(':');
        }

        if (!sort && config.sort_default) {
            sort = config.sort_default;
        }

        const fields = ts.get(query, 'fields');
        if (fields) {
            params._sourceInclude = ts.uniq(
                ts.parseList(fields)
                    .map((s) => s.toLowerCase())
            );
        }

        const geoField = config.default_geo_field;

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

        /** @todo add timeseries/history index support */
        // const history = ts.get(query, 'history');
        // const historyStart = ts.get(query, 'history_start');

        params.q = q;
        params.size = size;
        params.from = ts.toInteger(start) || 0;
        params.sort = sort;
        params.index = config.index;
        params.ignoreUnavailable = true;
        return ts.withoutNil(params);
    }

    getSearchResponse(response: es.SearchResponse<any>, query: i.InputQuery, params: es.SearchParams) {
        const config = this.config.search_config!;

        // I don't think this property actually exists
        const error = ts.get(response, 'error');
        if (error) {
            throw new ts.TSError(error, {
                context: {
                    config,
                    query,
                    safe: false
                }
            });
        }

        const totalShards = ts.get(response, '_shards.total', 0);
        if (!totalShards) {
            throw new ts.TSError('No results returned from query', {
                statusCode: 502,
                context: {
                    config,
                    query,
                    safe: true
                }
            });
        }

        let results;
        const total = response.hits.total;
        let returning = total;

        if (config.preserve_index_name) {
            results = response.hits.hits.map((data) => {
                const doc = data._source;
                doc._index = data._index;
                return doc;
            });
        } else {
            results = response.hits.hits.map((data) => data._source);
        }

        let info = `${response.hits.total} results found.`;
        if (params.size && response.hits.total > params.size) {
            returning = params.size;
            info += ` Returning ${returning}.`;
        }

        if (ts.get(query, 'sort') && !config.sort_enabled) {
            info += ' No sorting available.';
        }

        return {
            info,
            total,
            returning,
            results
        };
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
            }
        }
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
