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
 * Important Changes:
 * - date_field and geo_field will have to live in view.metadata.searchConfig
 * - Any geo search query should be added to constraint, not the
 * - The following configuration has been moved to the view:
 *      - fields
 *      - allowed_fields
 *
 * Question:
 * - Should the history options be added here?
 * - Should the date range be moved to the view constraints?
 * - I am not sure if "type" will work?
 * - Should we add support for post process and pre process?
 *
 * @todo add types to queryAccess
 */
export async function search(req: Request, client: Client, config: DataAccessConfig, logger: ts.Logger): Promise<[FinalResponse, boolean]> {
    const indexConfig: IndexConfig = get(config, 'space_metadata.indexConfig', {});
    const searchConfig: SearchConfig = get(config, 'view.metadata.searchConfig', {});
    const typesConfig: TypeConfig|undefined = get(config, 'view.metadata.typesConfig');

    if (!indexConfig) {
        throw new ts.TSError('Search is not configured correctly');
    }

    const searchOptions = getSearchOptions(req, searchConfig);

    const { q, size, start, pretty } = searchOptions;

    const queryAccess = new QueryAccess(config, typesConfig);

    const searchParams: SearchParams = {
        index: indexConfig.index,
        size,
        ignoreUnavailable: true
    };

    if (start != null) {
        searchParams.from = start;
    }

    const query = queryAccess.restrictESQuery(q, searchParams);

    logger.debug(query, 'searching...');

    const response = await client.search(query);
    const result = handleSearchResponse(response, searchConfig, searchOptions);

    return [result, pretty];
}

export function getSearchOptions(req: Request, config: SearchConfig) {
    const q: string = getFromQuery(req, 'q');
    if (!q && config.require_query) {
        throw new ts.TSError(...validationErr('q', 'must not be empty', req));
    }

    const pretty = ts.toBoolean(getFromQuery(req, 'pretty', false));

    const size = ts.toInteger(getFromQuery(req, 'size', 100));
    if (size === false) {
        throw new ts.TSError(...validationErr('size', 'must be a valid number', req));
    }

    const maxQuerySize: number = ts.toInteger(config.max_query_size) || 10000;
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
    if (sort && config.sort_enabled) {
        if (!ts.isString(sort)) {
            throw new ts.TSError(...validationErr('sort', 'must be a valid string', req));
        }

        let [field, direction] = sort.split(':');
        field = ts.trimAndToLower(field);
        direction = ts.trimAndToLower(direction);

        const dateField = ts.trimAndToLower(config.date_field);
        if (config.sort_dates_only && field !== dateField) {
            throw new ts.TSError(...validationErr('sort', `sorting currently available for the "${dateField}" field only`, req));
        }

        if (!field || !direction || !['asc', 'desc'].includes(direction)) {
            throw new ts.TSError(...validationErr('sort', 'must be field_name:asc or field_name:desc', req));
        }

        sort = [field, direction].join(':');
    }

    const sortDisabled = !!(sort && !config.sort_enabled);

    if (!sort && config.sort_default) {
        sort = config.sort_default;
    }

    // const dateStart = getFromQuery(req, 'date_start');
    // const dateEnd = getFromQuery(req, 'date_end');
    // const type = getFromQuery(req, 'type');
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
        // I am not sure should be here
        // dateStart,
        // dateEnd,
        // type,
    };
}

/** @todo */
export function buildGeoSort(config: SearchConfig, options: SearchOptions) {
    return;
}

export function handleSearchResponse(response: SearchResponse<any>, config: SearchConfig, options: SearchOptions) {
    const error = get(response, 'error');
    if (error) {
        throw new ts.TSError(error);
    }

    if (!response.hits || !response.hits.total) {
        throw new ts.TSError('No results returned from query');
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
        results = response.hits.hits.map(data => data._source);
    }

    let info = `${response.hits.total} results found.`;
    if (response.hits.total > options.size) {
        returning = options.size;
        info += ` Returning ${returning}.`;
    }

    if (options.sortDisabled) {
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

export interface SearchOptions {
    sortDisabled: boolean;
    size: number;
    q: string;
}

export interface FinalResponse {
    info: string;
    total: number;
    returning: number;
    results: any[];
}

export interface SearchConfig {
    max_query_size?: number;
    date_range?: boolean;
    sort_default?: string;
    sort_dates_only?: boolean;
    sort_enabled?: boolean;
    geo_field?: string;
    preserve_index_name?: string;
    require_query?: boolean;
    date_field?: string;
}

export interface ViewMetadata {
    searchConfig?: SearchConfig;
    typesConfig?: TypeConfig;
}

export interface IndexConfig {
    index?: string;
}

export interface SpaceMetadata {
    indexConfig?: IndexConfig;
}
