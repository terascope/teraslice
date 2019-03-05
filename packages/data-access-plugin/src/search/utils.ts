import get from 'lodash.get';
import * as ts from '@terascope/utils';
import { TypeConfig } from 'xlucene-evaluator';
import { SearchParams, Client, SearchResponse } from 'elasticsearch';
import { QueryAccess, DataAccessConfig } from '@terascope/data-access';

/**
 * Search elasticsearch in a teraserver backwards compatible way
 *
 * @todo add support for geo sort
 * @todo add timeseries/history support
 */
export function makeSearchFn(client: Client, accessConfig: DataAccessConfig, logger: ts.Logger): SearchFn {
    return async (query: InputQuery) => {
        const config = getSearchConfig(query, accessConfig);
        const { q, size, start, sort } = config.query;

        const queryAccess = new QueryAccess(accessConfig, config.types);

        const searchParams: SearchParams = {
            index: config.space.index,
            size,
            ignoreUnavailable: true
        };

        if (start != null) {
            searchParams.from = start;
        }

        if (sort != null) {
            searchParams.sort = sort;
        }

        const esQuery = queryAccess.restrictESQuery(q, searchParams);

        if (isTest) logger.debug(esQuery, 'searching...');

        const response = await client.search(esQuery);
        if (isTest) logger.trace(response, 'got response...');

        return handleSearchResponse(response, config);
    };
}

export function getSearchConfig(query: InputQuery, accessConfig: DataAccessConfig): SearchConfig {
    const config: SearchConfig = {
        space: get(accessConfig, 'space_metadata.indexConfig', {}),
        view: get(accessConfig, 'view.metadata.searchConfig', {}),
        types: get(accessConfig, 'view.metadata.typesConfig', {}),
        query: {} as SearchQueryConfig
    };

    if (ts.isEmpty(config.space.index) || !config.space.index) {
        throw new ts.TSError('Search is not configured correctly');
    }

    config.query = getQueryConfig(query, config);

    return config;
}

function ensureTypeConfig(config: SearchConfig) {
    if (!config.types) config.types = {};

    if (config.view.default_date_field) {
        config.view.default_date_field = ts.trimAndToLower(config.view.default_date_field);
    }

    const dateField = config.view.default_date_field;
    if (dateField && !config.types[dateField]) {
        config.types[dateField] = 'date';
    }

    if (config.view.default_geo_field) {
        config.view.default_geo_field = ts.trimAndToLower(config.view.default_geo_field);
    }

    const geoField = config.view.default_geo_field;
    if (geoField && !config.types[geoField]) {
        config.types[geoField] = 'geo';
    }
}

export function getQueryConfig(query: InputQuery, config: SearchConfig): SearchQueryConfig {
    ensureTypeConfig(config);

    const q: string = getFromQuery(query, 'q', '');
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

        if (config.view.sort_dates_only && !    dateFields.includes(field)) {
            throw new ts.TSError(...validationErr('sort', 'sorting is currently only available for date fields', query));
        }

        if (!field || !direction || !['asc', 'desc'].includes(direction)) {
            throw new ts.TSError(...validationErr('sort', 'must be field_name:asc or field_name:desc', query));
        }

        sort = [field, direction].join(':');
    }

    const sortDisabled = !!(sort && !config.view.sort_enabled);

    if (!sort && config.view.sort_default) {
        sort = config.view.sort_default;
    }

    const history = getFromQuery(query, 'history');
    const historyStart = getFromQuery(query, 'history_start');
    const historyPrefix = getFromQuery(query, 'history_prefix');
    const geoBoxTopLeft = getFromQuery(query, 'geo_box_top_left');
    const geoPoint = getFromQuery(query, 'geo_point');
    const geoDistance = getFromQuery(query, 'geo_distance');
    const geoSortPoint = getFromQuery(query, 'geo_sort_point');
    const geoSortOrder = getFromQuery(query, 'geo_sort_order', 'asc');
    const geoSortUnit = getFromQuery(query, 'geo_sort_unit', 'm');

    return {
        q,
        start,
        size,
        sort,
        history,
        historyStart,
        historyPrefix,
        geoBoxTopLeft,
        geoPoint,
        geoDistance,
        geoSortPoint,
        geoSortOrder,
        geoSortUnit,
        sortDisabled,
    };
}

export function buildGeoSort(config: SearchConfig) {
    return;
}

export function handleSearchResponse(response: SearchResponse<any>, config: SearchConfig) {
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
    if (response.hits.total > config.query.size) {
        returning = config.query.size;
        info += ` Returning ${returning}.`;
    }

    if (config.query.sortDisabled) {
        info += ' No sorting available.';
    }

    return {
        info,
        total,
        returning,
        results
    };
}

function validationErr(param: keyof InputQuery, msg: string, query: InputQuery): [string, ts.TSErrorConfig] {
    const given = ts.toString(getFromQuery(query, param));
    return [
        `Invalid ${param} parameter, ${msg}, was given: "${given}"`,
        {
            statusCode: 422,
            context: query
        }
    ];
}

export function getFromQuery(query: InputQuery, prop: keyof InputQuery, defaultVal?: any): any {
    return get(query, prop, defaultVal);
}

export interface SearchConfig {
    space: SearchSpaceConfig;
    view: SearchViewConfig;
    types: TypeConfig;
    query: SearchQueryConfig;
}

export interface SearchQueryConfig {
    sortDisabled: boolean;
    size: number;
    sort?: string;
    q: string;
    start?: number;
    history?: boolean;
    historyStart?: string;
    historyPrefix?: string;
    geoBoxTopLeft?: string;
    geoPoint?: string;
    geoDistance?: string;
    geoSortPoint?: string;
    geoSortOrder?: string;
    geoSortUnit?: string;
}

export interface InputQuery {
    size?: number;
    sort?: string;
    q?: string;
    start?: number;
    history?: boolean;
    history_start?: string;
    history_prefix?: string;
    geo_box_top_left?: string;
    geo_point?: string;
    geo_distance?: string;
    geo_sort_point?: string;
    geo_sort_order?: string;
    geo_sort_unit?: string;
}

export interface SearchFn {
    (query: any): Promise<FinalResponse>;
}

export interface FinalResponse {
    info: string;
    total: number;
    returning: number;
    results: any[];
}

export interface SearchViewConfig {
    max_query_size?: number;
    sort_default?: string;
    sort_dates_only?: boolean;
    sort_enabled?: boolean;
    default_geo_field?: string;
    preserve_index_name?: boolean;
    require_query?: boolean;
    default_date_field?: string;
}

export interface ViewMetadata {
    searchConfig?: SearchViewConfig;
    typesConfig?: TypeConfig;
}

export interface SearchSpaceConfig {
    index: string;
}

export interface SpaceMetadata {
    indexConfig?: SearchSpaceConfig;
}

const isTest = process.env.NODE_ENV !== 'production';
