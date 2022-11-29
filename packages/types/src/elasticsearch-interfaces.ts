import * as geo from './geo-interfaces';

/**
 * The sort direction
*/
export type SortOrder = 'asc'|'desc';

export interface ElasticsearchDSLOptions extends Partial<ClientMetadata> {
    /**
     * If a default_geo_field is set, this is required to enable sorting
    */
    geo_sort_point?: geo.GeoPoint;
    geo_sort_order?: SortOrder;
    geo_sort_unit?: geo.GeoDistanceUnit;
}

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
        [field: string]: string|{
            value: string;
            flags?: string;
            max_determinized_states?: number;
        };
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
    match_all: Record<string, never>;
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

export type ESFieldType =
    | 'long'
    | 'integer'
    | 'short'
    | 'byte'
    | 'double'
    | 'float'
    | 'keyword'
    | 'text'
    | 'boolean'
    | 'ip'
    | 'ip_range'
    | 'date'
    | 'geo_point'
    | 'geo_shape'
    | 'object'
    | 'nested';

export type ESTypeMapping =
    | PropertyESTypeMapping
    | FieldsESTypeMapping
    | BasicESTypeMapping
    | IgnoredESTypeMapping;

type BasicESTypeMapping = {
    type: ESFieldType;
    [prop: string]: any;
};

type IgnoredESTypeMapping = {
    enabled: boolean;
}

type FieldsESTypeMapping = {
    type: ESFieldType | string;
    fields: {
        [key: string]: {
            type: ESFieldType | string;
            index?: boolean | string;
            analyzer?: string;
        };
    };
};

export type PropertyESTypes = FieldsESTypeMapping | BasicESTypeMapping;
export type PropertyESTypeMapping = {
    type?: 'nested' | 'object';
    properties: {
        [key: string]: PropertyESTypes;
    };
};

export interface ESTypeMappings {
    [prop: string]: any;
    _all?: {
        enabled?: boolean;
        [key: string]: any;
    };
    dynamic?: boolean;
    properties: {
        [key: string]: ESTypeMapping;
    };
}

export interface ESMapping {
    mappings: {
        [typeName: string]: ESTypeMappings;
    };
    template?: string;
    order?: number;
    aliases?: any;
    index_patterns?: string[];
    settings: ESIndexSettings;
}

export interface ESIndexSettings {
    'index.number_of_shards'?: number | string;
    'index.number_of_replicas'?: number | string;
    'index.refresh_interval'?: string;
    'index.max_result_window'?: number | string;
    analysis?: {
        analyzer?: {
            [key: string]: any;
        };
        tokenizer?: {
            [key: string]: any;
        };
    };
    [setting: string]: any;
}

export enum ElasticsearchDistribution {
    opensearch = 'opensearch',
    elasticsearch = 'elasticsearch'
}

export interface ClientMetadata {
    distribution: ElasticsearchDistribution,
    version: string;
    majorVersion: number;
    minorVersion: number;
}
