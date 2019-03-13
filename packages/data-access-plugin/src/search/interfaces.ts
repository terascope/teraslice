import { TypeConfig } from 'xlucene-evaluator';

export type SortOrder = 'asc'|'desc';
export interface SearchConfig {
    space: SearchSpaceConfig;
    view: SearchViewConfig;
    types: TypeConfig;
}

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
}

export interface SearchSpaceConfig {
    index: string;
    indexConfig: string;
}

export interface SpaceMetadata {
    indexConfig?: SearchSpaceConfig;
    typesConfig?: TypeConfig;
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
