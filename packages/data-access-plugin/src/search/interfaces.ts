import { TypeConfig } from 'xlucene-evaluator';

export type SortOrder = 'asc'|'desc';
export interface SearchConfig {
    space: SearchSpaceConfig;
    view: SearchViewConfig;
    types: TypeConfig;
}

export interface InputQuery {
    size?: number;
    sort?: string;
    q?: string;
    start?: number;
    history?: boolean;
    history_start?: string;
    geo_box_top_left?: string;
    geo_box_bottom_right?: string;
    geo_point?: string;
    geo_distance?: string;
    geo_sort_point?: string;
    geo_sort_order?: SortOrder;
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
    history_prefix?: string;
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
