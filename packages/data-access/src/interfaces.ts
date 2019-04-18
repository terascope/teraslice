import { Logger } from '@terascope/utils';
import { IndexConfig, FindOptions, FindOneOptions } from 'elasticsearch-store';
import * as models from './models';

export type ModelName = 'User'|'Role'|'DataType'|'Space'|'View';
export type AuthUser = models.User|false;
export type AnyModel = models.User|models.Role|models.DataType|models.Space|models.View;

export type FindArgs<T> = { query?: string } & FindOptions<T>;
export type FindOneArgs<T> = { id: string } & FindOneOptions<T>;

export interface ManagerConfig {
    namespace?: string;
    storeOptions?: Partial<IndexConfig>;
    logger?: Logger;
}

export type SortOrder = 'asc'|'desc';

export interface InputQuery {
    size?: number|string;
    sort?: string;
    q?: string;
    start?: number|string;
    fields?: string|string[];
    history?: boolean;
    history_start?: string;
    geo_sort_point?: string;
    geo_sort_order?: SortOrder;
    geo_sort_unit?: string;
}

export interface GeoSortQuery {
    _geo_distance: {
        // @ts-ignore
        order: SortOrder;
        // @ts-ignore
        unit: string;

        [field: string]: {
            lat: number;
            lon: number;
        };
    };
}

export interface FinalResponse {
    info: string;
    total: number;
    returning: number;
    results: any[];
}

/**
 * The definition of an ACL for limiting access to data.
 *
 * This will be passed in in to non-admin data-access tools,
 * like FilterAccess and SearchAccess
*/
export interface DataAccessConfig {
    /**
     * The id of the user authenticated
    */
    user_id: string;

    /**
     * The id of the Role used
    */
    role_id: string;

    /**
     * The id of the space
    */
    space_id: string;

    /**
     * The space's search configuration
    */
    search_config?: models.SpaceSearchConfig;

    /**
     * The space's streaming configuration
    */
    streaming_config?: models.SpaceStreamingConfig;

    /**
     * The data type associated with the view
    */
    data_type: models.DataType;

    /**
     * The authenticated user's view of the space
    */
    view: models.View;
}
