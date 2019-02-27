import { Request } from 'express';
import { TSError, Logger } from '@terascope/utils';
import { Client, Config } from '@terascope/elasticsearch-api';
import { QueryAccess, DataAccessConfig } from '@terascope/data-access';
import { getFromReq } from '../utils';

/**
 * Search elasticsearch in a teraserver backwards compatible way
 *
 * @todo add types to queryAccess
 * @todo add support pre_process and post_process
 */
export async function search(req: Request, client: Client, config: DataAccessConfig, logger: Logger): Promise<any[]> {
    const { q } = getSearchOptions(req);
    const { indexConfig } = config.space_metadata as SpaceMetadata;
    // const viewMetadata = config.view.metadata as ViewMetadata;

    if (!indexConfig) {
        throw new TSError('Search is not configured correctly');
    }

    const queryAccess = new QueryAccess(config);

    const query = queryAccess.restrictESQuery(q, {
        index: indexConfig.index
    });

    logger.debug(query, 'searching...');
    return client.search(query);
}

function getSearchOptions(req: Request) {
    const q = getFromReq(req, 'q');
    const pretty = getFromReq(req, 'pretty');
    const dateStart = getFromReq(req, 'date_start');
    const dateEnd = getFromReq(req, 'date_end');
    const start = getFromReq(req, 'start');
    const size = getFromReq(req, 'size', 100);
    const type = getFromReq(req, 'type');
    const fields = getFromReq(req, 'fields');
    const history = getFromReq(req, 'history');
    const historyStart = getFromReq(req, 'history_start');
    const historyPrefix = getFromReq(req, 'history_prefix');
    const geoBoxTopLeft = getFromReq(req, 'geo_box_top_left');
    const geoPoint = getFromReq(req, 'geo_point');
    const geoDistance = getFromReq(req, 'geo_distance');
    const geoSortPoint = getFromReq(req, 'geo_sort_point');
    const geoSortOrder = getFromReq(req, 'geo_sort_order', 'asc');
    const geoSortUnit = getFromReq(req, 'geo_sort_unit', 'm');

    return {
        q,
        pretty,
        dateStart,
        dateEnd,
        start,
        size,
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

export interface SpaceMetadata {
    indexConfig?: Config;
}

export interface ViewMetadata {
    elasticsearch?: {
        max_query_size?: number;
        date_range?: boolean;
        sort_default?: string;
        sort_enabled?: boolean;
        geo_field?: string;
        preserve_index_name?: string;
        require_query?: boolean;
    };
}
