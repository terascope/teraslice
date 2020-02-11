import * as geo from './geo-interfaces';

export type SortOrder = 'asc'|'desc';

export type ElasticsearchDSLOptions = {
    /**
     * If a default_geo_field is set, this is required to enable sorting
    */
    geo_sort_point?: geo.GeoPoint;
    geo_sort_order?: SortOrder;
    geo_sort_unit?: geo.GeoDistanceUnit;
};

export type BoolQuery = {
    bool: {
        filter?: AnyQuery[];
        must_not?: AnyQuery[];
        should?: AnyQuery[];
    };
};

export type BoolQueryTypes = 'filter' | 'should' | 'must_not';

export type AnyQuery =
    | BoolQuery
    | GeoQuery
    | TermQuery
    | MatchQuery
    | MatchPhraseQuery
    | WildcardQuery
    | ExistsQuery
    | RegExprQuery
    | QueryStringQuery
    | RangeQuery
    | MultiMatchQuery

export interface ExistsQuery {
    exists: {
        field: string;
    };
}

export interface GeoQuery {
    geo_bounding_box?: {
        [field: string]: {
            top_left: geo.GeoPoint | string;
            bottom_right: geo.GeoPoint | string;
        };
    };
    geo_distance?: {
        distance: string;
        [field: string]: geo.GeoPoint | string;
    };
    geo_polygon?: {
        [field: string]: {
            points: geo.GeoPoint[] | string[] | geo.CoordinateTuple[];
        };
    };
    geo_shape?: {
        [field: string]: {
            shape: geo.ESGeoShape;
            relation: geo.GeoShapeRelation;
        };
    };
}

export interface RegExprQuery {
    regexp: {
        [field: string]: string;
    };
}

export interface QueryStringQuery {
    query_string: {
        fields: string[];
        query: string;
    };
}

export interface MatchQuery {
    match: {
        [field: string]: {
            query: string;
            operator: 'and' | 'or';
        };
    };
}

export interface MatchPhraseQuery {
    match_phrase: {
        [field: string]: {
            query: string;
        };
    };
}

export interface TermQuery {
    term: {
        [field: string]: number | boolean;
    };
}

export interface WildcardQuery {
    wildcard: {
        [field: string]: string;
    };
}

export interface RangeQuery {
    range: {
        [field: string]: RangeExpression;
    };
}

export interface MultiMatchQuery {
    multi_match: {
        query: string;
        fields?: string[];
    };
}

export interface RangeExpression {
    gte?: string | number;
    lte?: string | number;
    gt?: string | number;
    lt?: string | number;
}

export type ConstantScoreQuery = {
    constant_score: {
        filter: AnyQuery | AnyQuery[];
    };
};

export type MatchAllQuery = {
    match_all: {};
};

export type GeoDistanceSort = {
    [field: string]: SortOrder | geo.GeoDistanceUnit | {
        lat: number;
        lon: number;
    };
};

export type GeoSortQuery = {
    _geo_distance: GeoDistanceSort;
};

export type AnyQuerySort = GeoSortQuery;

export type ElasticsearchDSLResult = {
    query: ConstantScoreQuery | MatchAllQuery;
    sort?: AnyQuerySort|AnyQuerySort[];
};
