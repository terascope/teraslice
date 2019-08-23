import { Units } from '@turf/helpers';
import { Logger } from '@terascope/utils';
import * as parser from '../parser';

export type SortOrder = 'asc'|'desc';

export type TranslatorOptions = {
    logger?: Logger;
    type_config?: parser.TypeConfig,
    default_geo_sort_order?: SortOrder;
    default_geo_sort_unit?: Units|string;
};

export type UtilsTranslateQueryOptions = {
    logger: Logger;
    default_geo_sort_order: SortOrder;
    default_geo_sort_unit: Units;
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

export interface GeoQuery {
    geo_bounding_box?: {
        [field: string]: {
            top_left: parser.GeoPoint | string;
            bottom_right: parser.GeoPoint | string;
        };
    };
    geo_distance?: {
        distance: string;
        [field: string]: parser.GeoPoint | string;
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
    [field: string]: SortOrder|Units|{
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
    sort?: AnyQuerySort;
};
