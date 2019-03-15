import get from 'lodash.get';
import * as ts from '@terascope/utils';
import { parseGeoPoint, TypeConfig, GEO_DISTANCE_UNITS } from 'xlucene-evaluator';
import { SearchParams, Client, SearchResponse } from 'elasticsearch';
import * as da from '@terascope/data-access';
import * as i from './interfaces';

/**
 * Search elasticsearch in a teraserver backwards compatible way
 */
export function makeSearchFn(client: Client, accessConfig: da.DataAccessConfig, logger: ts.Logger): i.SearchFn {
    const config = getSearchConfig(accessConfig);
    const types = getTypesConfig(accessConfig, config);
    const queryAccess = new da.QueryAccess(accessConfig, types);

    return async (query: i.InputQuery) => {
        const params = getSearchParams(query, config, types);
        const { q = '' } = params;

        const esQuery = queryAccess.restrictESQuery(q, params);

        if (isTest) logger.debug(esQuery, 'searching...');

        const response = await client.search(esQuery);
        if (isTest) logger.trace(response, 'got response...');

        return getSearchResponse(response, config, query, params);
    };
}

export function getSearchConfig(accessConfig: da.DataAccessConfig): da.SpaceSearchConfig {
    const searchConfig = accessConfig.search_config;

    if (!searchConfig || ts.isEmpty(searchConfig) || !searchConfig.index) {
        throw new ts.TSError('Search is not configured correctly for search');
    }

    if (searchConfig.default_date_field) {
        searchConfig.default_date_field = ts.trimAndToLower(searchConfig.default_date_field);
    }

    if (searchConfig.default_geo_field) {
        searchConfig.default_geo_field = ts.trimAndToLower(searchConfig.default_geo_field);
    }

    return searchConfig;
}

export function getTypesConfig(accessConfig: da.DataAccessConfig, searchConfig: da.SpaceSearchConfig): TypeConfig {
    const typesConfig = get(accessConfig, 'data_type.typesConfig', {});

    const dateField = searchConfig.default_date_field;
    if (dateField && !typesConfig[dateField]) {
        typesConfig[dateField] = 'date';
    }

    const geoField = searchConfig.default_geo_field;
    if (geoField && !typesConfig[geoField]) {
        typesConfig[geoField] = 'geo';
    }

    return typesConfig;
}

export function getSearchParams(query: i.InputQuery, config: da.SpaceSearchConfig, types: TypeConfig = {}): SearchParams {
    const params: SearchParams = {
        body: {}
    };

    const q: string = getFromQuery(query, 'q', '');
    if (!q && config.require_query) {
        throw new ts.TSError(...validationErr('q', 'must not be empty', query));
    }

    const size = ts.toInteger(getFromQuery(query, 'size', 100));
    if (size === false) {
        throw new ts.TSError(...validationErr('size', 'must be a valid number', query));
    }

    const maxQuerySize: number = ts.toInteger(config.max_query_size) || 10000;
    if (size > maxQuerySize) {
        throw new ts.TSError(...validationErr('size', `must be less than ${maxQuerySize}`, query));
    }

    const start = getFromQuery(query, 'start');
    if (start) {
        if (!ts.isNumber(start)) {
            throw new ts.TSError(...validationErr('start', 'must be a valid number', query));
        }
    }

    let sort: string = getFromQuery(query, 'sort');
    if (sort && config.sort_enabled) {
        if (!ts.isString(sort)) {
            throw new ts.TSError(...validationErr('sort', 'must be a valid string', query));
        }

        let [field, direction = 'asc'] = sort.split(':');
        field = ts.trimAndToLower(field);
        direction = ts.trimAndToLower(direction);

        const dateFields: string[] = [];
        for (const [key, val] of Object.entries(types)) {
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

    const fields = getFromQuery(query, 'fields');
    if (fields) {
        params._sourceInclude = ts.uniq(
            ts.parseList(fields)
                .map((s) => s.toLowerCase())
        );
    }

    const geoField = config.default_geo_field;

    if (geoField) {
        const geoSortPoint = getFromQuery(query, 'geo_sort_point');
        const geoSortOrder = getFromQuery(query, 'geo_sort_order', 'asc');
        const geoSortUnit = getFromQuery(query, 'geo_sort_unit', 'm');

        // add geo sort query
        if (geoSortOrder && geoSortUnit && geoSortPoint) {
            if (!GEO_DISTANCE_UNITS[geoSortUnit]) {
                throw new ts.TSError(...validationErr('geo_sort_unit', 'must be one of "mi", "yd", "ft", "km" or "m"', query));
            }

            params.body.sort = getGeoSort(geoField, geoSortPoint, geoSortOrder, geoSortUnit);
        }
    }

    /** @todo add timeseries/history index support */
    // const history = getFromQuery(query, 'history');
    // const historyStart = getFromQuery(query, 'history_start');

    params.q = q;
    params.size = size;
    params.from = start;
    params.sort = sort;
    params.index = config.index;
    params.ignoreUnavailable = true;
    return ts.withoutNil(params);
}

export function getGeoSort(field: string, point: string, order: i.SortOrder, unit: string): i.GeoSortQuery {
    const [lat, lon] = parseGeoPoint(point);

    const sort = { _geo_distance: {} } as i.GeoSortQuery;
    sort._geo_distance[field] = { lat, lon };

    sort._geo_distance.order = order;
    sort._geo_distance.unit = unit;
    return sort;
}

/** @todo we should add index context to the error */
export function getSearchResponse(response: SearchResponse<any>, config: da.SpaceSearchConfig, query: i.InputQuery, params: SearchParams) {
    // I don't think this property actually exists
    const error = get(response, 'error');
    if (error) {
        throw new ts.TSError(error);
    }

    const totalShards = get(response, '_shards.total', 0);
    if (!totalShards) {
        throw new ts.TSError('No results returned from query', {
            statusCode: 502
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

    if (getFromQuery(query, 'sort') && !config.sort_enabled) {
        info += ' No sorting available.';
    }

    return {
        info,
        total,
        returning,
        results
    };
}

function validationErr(param: keyof i.InputQuery, msg: string, query: i.InputQuery): [string, ts.TSErrorConfig] {
    const given = ts.toString(getFromQuery(query, param));
    return [
        `Invalid ${param} parameter, ${msg}, was given: "${given}"`,
        {
            statusCode: 422,
            context: query
        }
    ];
}

export function getFromQuery(query: i.InputQuery, prop: keyof i.InputQuery, defaultVal?: any): any {
    return get(query, prop, defaultVal);
}

const isTest = process.env.NODE_ENV !== 'production';
