import get from 'lodash.get';
import { Request } from 'express';
import * as ts from '@terascope/utils';
import { SearchParams } from 'elasticsearch';
import { Client, Config } from '@terascope/elasticsearch-api';
import { QueryAccess, DataAccessConfig } from '@terascope/data-access';
import { getFromQuery } from '../utils';

/**
 * Search elasticsearch in a teraserver backwards compatible way
 *
 * Important Changes:
 * - Date field will have to live in view.metadata.searchConfig
 *
 * Question:
 * - Should Date Range should be moved to the view constraints?
 * - I am not sure if type will work?
 *
 * @todo add types to queryAccess
 * @todo add support pre_process and post_process
 */
export async function search(req: Request, client: Client, config: DataAccessConfig, logger: ts.Logger): Promise<any[]> {
    const { indexConfig } = get(config, 'space_metadata', {}) as SpaceMetadata;
    const { searchConfig = {} } = get(config, 'view.metadata', {}) as ViewMetadata;

    if (!indexConfig) {
        throw new ts.TSError('Search is not configured correctly');
    }

    const { q, size, start } = getSearchOptions(req, searchConfig);

    const queryAccess = new QueryAccess(config);

    const searchParams: SearchParams = {
        index: indexConfig.index,
        size,
    };

    if (start) {
        searchParams.from = start;
    }

    const query = queryAccess.restrictESQuery(q, searchParams);

    logger.debug(query, 'searching...');
    return client.search(query);
}

export function getSearchOptions(req: Request, searchConfig: SearchConfig) {
    const q: string = getFromQuery(req, 'q');
    const pretty: boolean = getFromQuery(req, 'pretty', false);

    const size = ts.toInteger(getFromQuery(req, 'size', 100));
    if (size === false) {
        throw new ts.TSError(...validateErr('size', 'must be a valid number', req));
    }

    const maxQuerySize: number = ts.toInteger(searchConfig.max_query_size) || 10000;
    if (size > maxQuerySize) {
        throw new ts.TSError(...validateErr('size', `must be less than ${maxQuerySize}`, req));
    }

    const start = getFromQuery(req, 'start');
    if (start) {
        if (!ts.isNumber(start)) {
            throw new ts.TSError(...validateErr('start', 'must be a valid number', req));
        }
    }

    let sort: string = getFromQuery(req, 'sort');
    if (sort && searchConfig.sort_enabled) {
        if (!ts.isString(sort)) {
            throw new ts.TSError(...validateErr('sort', 'must be a valid string', req));
        }

        let [field, direction] = sort.split(':');
        field = field && field.trim().toLowerCase();
        direction = direction && direction.trim().toLowerCase();

        if (!field || !direction || !['asc', 'desc'].includes(direction)) {
            throw new ts.TSError(...validateErr('sort', 'must be field_name:asc or field_name:desc', req));
        }

        const dateField = searchConfig.date_field && searchConfig.date_field.trim().toLowerCase();
        if (searchConfig.sort_dates_only && field !== dateField) {
            throw new ts.TSError(...validateErr('sort', `sorting currently available for the '${dateField}' field only`, req));
        }

        sort = [field, direction].join(':');
    }

    if (!sort && searchConfig.sort_default) {
        sort = searchConfig.sort_default;
    }

    // const dateStart = getFromQuery(req, 'date_start');
    // const dateEnd = getFromQuery(req, 'date_end');
    const type = getFromQuery(req, 'type');
    const fields = getFromQuery(req, 'fields');
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
        // dateStart,
        // dateEnd,
        start,
        size,
        maxQuerySize,
        type,
        fields,
        history,
        historyStart,
        historyPrefix,
        geoBoxTopLeft,
        geoPoint,
        geoDistance,
        geoSortPoint,
        geoSortOrder,
        geoSortUnit,
    };
}

function validateErr(param: string, msg: string, req: Request): [string, ts.TSErrorConfig] {
    return [
        `Invalid ${param} parameter, ${msg}, was given: ${getFromQuery(req, param)}`,
        {
            statusCode: 422,
            context: req.query
        }
    ];
}

export interface SpaceMetadata {
    indexConfig?: Config;
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
}
