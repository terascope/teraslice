import get from 'lodash.get';
import { Request } from 'express';
import * as ts from '@terascope/utils';
import { TypeConfig } from 'xlucene-evaluator';
import { SearchParams, Client, SearchResponse } from 'elasticsearch';
import { QueryAccess, DataAccessConfig } from '@terascope/data-access';
import { getFromQuery } from '../utils';

/**
 * Search elasticsearch in a teraserver backwards compatible way
 *
 * @todo add support for geo sort
 * @todo add timeseries/history support
 * @todo figure out how to support post process
 */
export async function search(req: Request, client: Client, accessConfig: DataAccessConfig, logger: ts.Logger): Promise<[FinalResponse, boolean]> {
    const config = getSearchConfig(req, accessConfig);
    const { q, size, start, pretty, sort } = config.query;

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

    const query = queryAccess.restrictESQuery(q, searchParams);

    if (isTest) logger.debug(query, 'searching...');

    const response = await client.search(query);
    if (isTest) logger.trace(response, 'got response...');

    const result = handleSearchResponse(response, config);

    return [result, pretty];
}

export function getSearchConfig(req: Request, accessConfig: DataAccessConfig): SearchConfig {
    const config: SearchConfig = {
        space: get(accessConfig, 'space_metadata.indexConfig', {}),
        view: get(accessConfig, 'view.metadata.searchConfig', {}),
        types: get(accessConfig, 'view.metadata.typesConfig', {}),
        query: {} as SearchQueryConfig
    };

    if (ts.isEmpty(config.space.index) || !config.space.index) {
        throw new ts.TSError('Search is not configured correctly');
    }

    config.query = getQueryConfig(req, config);

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

export function getQueryConfig(req: Request, config: SearchConfig): SearchQueryConfig {
    ensureTypeConfig(config);

    const q: string = getFromQuery(req, 'q', '');
    if (!q && config.view.require_query) {
        throw new ts.TSError(...validationErr('q', 'must not be empty', req));
    }

    const pretty = ts.toBoolean(getFromQuery(req, 'pretty', false));

    const size = ts.toInteger(getFromQuery(req, 'size', 100));
    if (size === false) {
        throw new ts.TSError(...validationErr('size', 'must be a valid number', req));
    }

    const maxQuerySize: number = ts.toInteger(config.view.max_query_size) || 10000;
    if (size > maxQuerySize) {
        throw new ts.TSError(...validationErr('size', `must be less than ${maxQuerySize}`, req));
    }

    const start = getFromQuery(req, 'start');
    if (start) {
        if (!ts.isNumber(start)) {
            throw new ts.TSError(...validationErr('start', 'must be a valid number', req));
        }
    }

    let sort: string = getFromQuery(req, 'sort');
    if (sort && config.view.sort_enabled) {
        if (!ts.isString(sort)) {
            throw new ts.TSError(...validationErr('sort', 'must be a valid string', req));
        }

        let [field, direction] = sort.split(':');
        field = ts.trimAndToLower(field);
        direction = ts.trimAndToLower(direction);

        const dateFields: string[] = [];
        for (const [key, val] of Object.entries(config.types)) {
            if (val === 'date') {
                dateFields.push(key);
            }
        }

        if (config.view.sort_dates_only && !    dateFields.includes(field)) {
            throw new ts.TSError(...validationErr('sort', 'sorting is currently only available for date fields', req));
        }

        if (!field || !direction || !['asc', 'desc'].includes(direction)) {
            throw new ts.TSError(...validationErr('sort', 'must be field_name:asc or field_name:desc', req));
        }

        sort = [field, direction].join(':');
    }

    const sortDisabled = !!(sort && !config.view.sort_enabled);

    if (!sort && config.view.sort_default) {
        sort = config.view.sort_default;
    }

    const history = getFromQuery(req, 'history');
    const historyStart = getFromQuery(req, 'history_start');
    const historyPrefix = getFromQuery(req, 'history_prefix');
    const geoBoxTopLeft = getFromQuery(req, 'geo_box_top_left');
    const geoPoint = getFromQuery(req, 'geo_point');
    const geoDistance = getFromQuery(req, 'geo_distance');
    const geoSortPoint = getFromQuery(req, 'geo_sort_point');
    const geoSortOrder = getFromQuery(req, 'geo_sort_order', 'asc');
    const geoSortUnit = getFromQuery(req, 'geo_sort_unit', 'm');

    return {
        q,
        pretty,
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

export function buildGeoSort(config: SearchViewConfig, options: SearchQueryConfig) {
    return;
}

export function handleSearchResponse(response: SearchResponse<any>, searchConfig: SearchConfig) {
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

    if (searchConfig.view.preserve_index_name) {
        results = response.hits.hits.map((data) => {
            const doc = data._source;
            doc._index = data._index;
            return doc;
        });
    } else {
        results = response.hits.hits.map((data) => data._source);
    }

    let info = `${response.hits.total} results found.`;
    if (response.hits.total > searchConfig.query.size) {
        returning = searchConfig.query.size;
        info += ` Returning ${returning}.`;
    }

    if (searchConfig.query.sortDisabled) {
        info += ' No sorting available.';
    }

    return {
        info,
        total,
        returning,
        results
    };
}

function validationErr(param: string, msg: string, req: Request): [string, ts.TSErrorConfig] {
    const given = ts.toString(getFromQuery(req, param));
    return [
        `Invalid ${param} parameter, ${msg}, was given: "${given}"`,
        {
            statusCode: 422,
            context: req.query
        }
    ];
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
    pretty: boolean;
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
