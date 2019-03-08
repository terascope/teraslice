import get from 'lodash.get';
import * as ts from '@terascope/utils';
import { parseGeoPoint, TypeConfig, GEO_DISTANCE_UNITS } from 'xlucene-evaluator';
import { SearchParams, Client, SearchResponse } from 'elasticsearch';
import { QueryAccess, DataAccessConfig } from '@terascope/data-access';
import * as i from './interfaces';

/**
 * Search elasticsearch in a teraserver backwards compatible way
 */
export function makeSearchFn(client: Client, accessConfig: DataAccessConfig, logger: ts.Logger): i.SearchFn {
    const config = getSearchConfig(accessConfig);
    const queryAccess = new QueryAccess(accessConfig, config.types);

    return async (query: i.InputQuery) => {
        const params = getSearchParams(query, config);
        const { q = '' } = params;

        const esQuery = queryAccess.restrictESQuery(q, params);

        if (isTest) logger.debug(esQuery, 'searching...');

        const response = await client.search(esQuery);
        if (isTest) logger.trace(response, 'got response...');

        return getSearchResponse(response, config, query, params);
    };
}

export function getSearchConfig(accessConfig: DataAccessConfig): i.SearchConfig {
    const space = getSpaceConfig(accessConfig);
    const view = getViewConfig(accessConfig);
    const types = getTypesConfig(accessConfig, view);

    return {
        space,
        view,
        types,
    };
}

function getViewConfig(accessConfig: DataAccessConfig): i.SearchViewConfig {
    const viewConfig: i.SearchViewConfig = get(accessConfig, 'view.metadata.searchConfig', {});

    if (viewConfig.default_date_field) {
        viewConfig.default_date_field = ts.trimAndToLower(viewConfig.default_date_field);
    }

    if (viewConfig.default_geo_field) {
        viewConfig.default_geo_field = ts.trimAndToLower(viewConfig.default_geo_field);
    }

    return viewConfig;
}

function getSpaceConfig(accessConfig: DataAccessConfig): i.SearchSpaceConfig {
    const spaceConfig: i.SearchSpaceConfig = get(accessConfig, 'space_metadata.indexConfig', {});

    if (ts.isEmpty(spaceConfig.index) || !spaceConfig.index) {
        throw new ts.TSError('Search is not configured correctly');
    }

    return spaceConfig;
}

export function getTypesConfig(accessConfig: DataAccessConfig, viewConfig: i.SearchViewConfig): TypeConfig {
    const typesConfig = get(accessConfig, 'view.metadata.typesConfig', {});

    const dateField = viewConfig.default_date_field;
    if (dateField && !typesConfig[dateField]) {
        typesConfig[dateField] = 'date';
    }

    const geoField = viewConfig.default_geo_field;
    if (geoField && !typesConfig[geoField]) {
        typesConfig[geoField] = 'geo';
    }

    return typesConfig;
}

export function getSearchParams(query: i.InputQuery, config: i.SearchConfig): SearchParams {
    const params: SearchParams = {
        body: {}
    };

    let q: string = getFromQuery(query, 'q', '');
    if (!q && config.view.require_query) {
        throw new ts.TSError(...validationErr('q', 'must not be empty', query));
    }

    const size = ts.toInteger(getFromQuery(query, 'size', 100));
    if (size === false) {
        throw new ts.TSError(...validationErr('size', 'must be a valid number', query));
    }

    const maxQuerySize: number = ts.toInteger(config.view.max_query_size) || 10000;
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
    if (sort && config.view.sort_enabled) {
        if (!ts.isString(sort)) {
            throw new ts.TSError(...validationErr('sort', 'must be a valid string', query));
        }

        let [field, direction = 'asc'] = sort.split(':');
        field = ts.trimAndToLower(field);
        direction = ts.trimAndToLower(direction);

        const dateFields: string[] = [];
        for (const [key, val] of Object.entries(config.types)) {
            if (val === 'date') {
                dateFields.push(key);
            }
        }

        if (config.view.sort_dates_only && !dateFields.includes(field)) {
            throw new ts.TSError(...validationErr('sort', 'sorting is currently only available for date fields', query));
        }

        if (!field || !direction || !['asc', 'desc'].includes(direction)) {
            throw new ts.TSError(...validationErr('sort', 'must be field_name:asc or field_name:desc', query));
        }

        sort = [field, direction].join(':');
    }

    if (!sort && config.view.sort_default) {
        sort = config.view.sort_default;
    }

    const fields = getFromQuery(query, 'fields');
    if (fields) {
        params._sourceInclude = ts.uniq(
            ts.parseList(fields)
                .map((s) => s.toLowerCase())
        );
    }

    const geoField = config.view.default_geo_field;

    if (geoField) {
        const geoPoint = getFromQuery(query, 'geo_point');
        const geoDistance = getFromQuery(query, 'geo_distance');
        const geoBoxTopLeft = getFromQuery(query, 'geo_box_top_left');
        const geoBoxBottomRight = getFromQuery(query, 'geo_box_bottom_right');
        const geoSortPoint = getFromQuery(query, 'geo_sort_point', geoPoint);
        const geoSortOrder = getFromQuery(query, 'geo_sort_order', 'asc');
        const geoSortUnit = getFromQuery(query, 'geo_sort_unit', 'm');

        // add geo sort query
        if (geoSortOrder && geoSortUnit && geoSortPoint) {
            if (!GEO_DISTANCE_UNITS[geoSortUnit]) {
                throw new ts.TSError(...validationErr('geo_sort_unit', 'must be one of "mi", "yd", "ft", "km" or "m"', query));
            }

            params.body.sort = getGeoSort(geoField, geoSortPoint, geoSortOrder, geoSortUnit);
        }

        let geoQuery = '';
        if (geoPoint && geoDistance) {
            geoQuery += getGeoPointQuery(geoField, geoPoint, geoDistance);
        } else if (geoBoxTopLeft && geoBoxBottomRight) {
            geoQuery += getGeoBoundingBoxQuery(geoField, geoBoxTopLeft, geoBoxBottomRight);
        }

        if (geoQuery) {
            q = `(${q}) AND (${geoQuery})`;
        }
    }

    /** @todo add timeseries/history index support */
    // const history = getFromQuery(query, 'history');
    // const historyStart = getFromQuery(query, 'history_start');

    params.q = q;
    params.size = size;
    params.from = start;
    params.sort = sort;
    params.index = config.space.index;
    params.ignoreUnavailable = true;
    return ts.withoutNil(params);
}

export function getGeoPointQuery(field: string, point: string, distance: string): string {
    const geoQuery = `_geo_point_:"${point}" _geo_distance_:${distance}`;
    return `${field}:(${geoQuery})`;
}

export function getGeoBoundingBoxQuery(field: string, topLeft: string, bottomRight: string): string {
    const geoQuery = `_geo_box_top_left_:"${topLeft}" _geo_box_bottom_right_:"${bottomRight}"`;
    return `${field}:(${geoQuery})`;
}

export function getGeoSort(field: string, point: string, order: i.SortOrder, unit: string): i.GeoSortQuery {
    const [lat, lon] = parseGeoPoint(point);

    const sort = { _geo_distance: {} } as i.GeoSortQuery;
    sort._geo_distance[field] = { lat, lon };

    sort._geo_distance.order = order;
    sort._geo_distance.unit = unit;
    return sort;
}

export function getSearchResponse(response: SearchResponse<any>, config: i.SearchConfig, query: i.InputQuery, params: SearchParams) {
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

    if (config.view.preserve_index_name) {
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

    if (getFromQuery(query, 'sort') && !config.view.sort_enabled) {
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
