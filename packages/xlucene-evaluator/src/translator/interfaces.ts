import * as parser from '../parser';

export type BoolQuery = {
    bool: {
        filter: AnyQuery[],
        must_not: AnyQuery[],
        should: AnyQuery[],
    }
};

export type AnyQuery = BoolQuery|GeoQuery|TermQuery|WildcardQuery|ExistsQuery|RegExprQuery|RangeQuery;

export interface ExistsQuery {
    exists: {
        field: string;
    };
}

export interface GeoQuery {
    geo_bounding_box?: {
        [field: string]: {
            top_left: parser.GeoPoint|string;
            bottom_right: parser.GeoPoint|string;
        }
    };
    geo_distance?: {
        distance: string;
        [field: string]: parser.GeoPoint|string;
    };
}

export interface RegExprQuery {
    regexp: {
        [field: string]: string;
    };
}

export interface TermQuery {
    term: {
        [field: string]: string|number|boolean;
    };
}

export interface WildcardQuery {
    wildcard: {
        [field: string]: string;
    };
}

export interface RangeQuery {
    range: {
        [field: string]: RangeExpression
    };
}

export interface RangeExpression {
    gte?: string|number;
    lte?: string|number;
    gt?: string|number;
    lt?: string|number;
}

export interface ElasticsearchDSLResult {
    query: {
        constant_score: {
            filter: BoolQuery | never[]
        }
    } | {
        query_string: {
            query: ''
        }
    };
}
