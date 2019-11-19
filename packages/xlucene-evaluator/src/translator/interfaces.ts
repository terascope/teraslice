import { Logger } from '@terascope/utils';
import {
    GeoPoint,
    GeoDistanceUnit,
    TypeConfig,
    GeoShapeRelation,
    CoordinateTuple,
} from '../interfaces';

export type SortOrder = 'asc'|'desc';

export type TranslatorOptions = {
    logger?: Logger;
    type_config?: TypeConfig;
    default_geo_field?: string;
    default_geo_sort_order?: SortOrder;
    default_geo_sort_unit?: GeoDistanceUnit|string;
};

export type UtilsTranslateQueryOptions = {
    logger: Logger;
    default_geo_field?: string;
    geo_sort_point?: GeoPoint;
    geo_sort_order: SortOrder;
    geo_sort_unit: GeoDistanceUnit;
};

export type ElasticsearchDSLOptions = {
    /**
     * If a default_geo_field is set, this is required to enable sorting
    */
    geo_sort_point?: GeoPoint;
    geo_sort_order?: SortOrder;
    geo_sort_unit?: GeoDistanceUnit;
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
    | RangeQuery
    | MultiMatchQuery;

export interface ExistsQuery {
    exists: {
        field: string;
    };
}

export enum ESGeoShapeType {
    Point = 'point',
    Polygon = 'polygon',
    MultiPolygon = 'multipolygon'
}

export type ESGeoShapePoint = {
    type: ESGeoShapeType.Point;
    coordinates: CoordinateTuple;
}

export type ESGeoShapePolygon = {
    type: ESGeoShapeType.Polygon;
    coordinates: CoordinateTuple[][];
}

export type ESGeoShapeMultiPolygon = {
    type: ESGeoShapeType.MultiPolygon;
    coordinates: CoordinateTuple[][][];
}

export type ESGeoShape = ESGeoShapePoint | ESGeoShapePolygon | ESGeoShapeMultiPolygon

export interface GeoQuery {
    geo_bounding_box?: {
        [field: string]: {
            top_left: GeoPoint | string;
            bottom_right: GeoPoint | string;
        };
    };
    geo_distance?: {
        distance: string;
        [field: string]: GeoPoint | string;
    };
    geo_polygon?: {
        [field: string]: {
            points: GeoPoint[] | string[] | CoordinateTuple[];
        };
    };
    geo_shape?: {
        [field: string]: {
            shape: ESGeoShape;
            relation: GeoShapeRelation;
        };
    };
}

export interface RegExprQuery {
    regexp: {
        [field: string]: string;
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
    [field: string]: SortOrder | GeoDistanceUnit | {
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
