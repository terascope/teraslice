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

export interface SearchFn {
    (query: any): Promise<FinalResponse>;
}

export interface FinalResponse {
    info: string;
    total: number;
    returning: number;
    results: any[];
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
