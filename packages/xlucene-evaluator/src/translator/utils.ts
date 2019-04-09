import { debugLogger, TSError } from '@terascope/utils';
import * as parser from '../parser';

const logger = debugLogger('xlucene-translator-utils');

export function buildAnyQuery(node: parser.AST): AnyQuery|undefined {
    const field = parser.getField(node);
    if (parser.isWildcard(node) && node.value === '*') {
        return;
    }

    if (parser.isLogicalGroup(node) || parser.isFieldGroup(node)) {
        return buildBoolQuery(node);
    }

    if (parser.isNegation(node)) {
        return buildNegationQuery(node);
    }

    if (!field) {
        const error = new TSError('Unexpected problem when translating xlucene query', {
            context: {
                node,
            },
        });
        logger.error(error);
        throw error;
    }

    if (parser.isExists(node)) {
        return buildExistsQuery(node, field);
    }

    if (parser.isTerm(node)) {
        return buildTermQuery(node, field);
    }

    if (parser.isRegexp(node)) {
        return buildRegExprQuery(node, field);
    }

    if (parser.isWildcard(node)) {
        return buildWildcardQuery(node, field);
    }

    if (parser.isRange(node)) {
        return buildRangeQuery(node, field);
    }

    if (parser.isGeoBoundingBox(node)) {
        return buildGeoBoundingBoxQuery(node, field);
    }

    if (parser.isGeoDistance(node)) {
        return buildGeoDistanceQuery(node, field);
    }

    logger.error(new Error('unsupport ast node'), node);
    return;
}

export function buildGeoBoundingBoxQuery(node: parser.GeoBoundingBox, field: string): GeoQuery {
    const geoQuery: GeoQuery = {};
    geoQuery['geo_bounding_box'] = {};
    geoQuery['geo_bounding_box'][field] = {
        top_left:  node.top_left,
        bottom_right: node.bottom_right
    };

    logger.trace('built geo bounding box query', { node, geoQuery });
    return geoQuery;
}

export function buildGeoDistanceQuery(node: parser.GeoDistance, field: string): GeoQuery {
    const geoQuery: GeoQuery = {};
    geoQuery['geo_distance'] = {
        distance: `${node.distance}${node.unit}`,
    };
    geoQuery['geo_distance'][field] = {
        lat: node.lat,
        lon: node.lon,
    };

    logger.trace('built geo distance query', { node, geoQuery });
    return geoQuery;
}

export function buildRangeQuery(node: parser.Range, field: string): RangeQuery {
    const rangeQuery: RangeQuery = { range: {} };
    rangeQuery.range[field] = {};
    if (node.left) {
        rangeQuery.range[field][node.left.operator] = node.left.value;
    }
    if (node.right) {
        rangeQuery.range[field][node.right.operator] = node.right.value;
    }
    logger.trace('built range query', { node, rangeQuery });
    return rangeQuery;
}

export function buildTermQuery(node: parser.Term, field: string): TermQuery|RegExprQuery|WildcardQuery {
    const termQuery: TermQuery = { term: {} };
    termQuery.term[field] = node.value;
    logger.trace('built term query', node, termQuery);
    return termQuery;
}

export function buildWildcardQuery(node: parser.Wildcard, field: string): WildcardQuery {
    const wildcardQuery: WildcardQuery = { wildcard: {} };
    wildcardQuery.wildcard[field] = node.value;
    logger.trace('built wildcard query', { node, wildcardQuery });
    return wildcardQuery;
}

export function buildRegExprQuery(node: parser.Regexp, field: string): RegExprQuery {
    const regexQuery: RegExprQuery = { regexp: {} };
    regexQuery.regexp[field] = node.value;
    logger.trace('built regexpr query', { node, regexQuery });
    return regexQuery;
}

export function buildExistsQuery(node: parser.Exists, field: string): ExistsQuery {
    const existsQuery: ExistsQuery = {
        exists: {
            field
        }
    };
    logger.trace('built exists query', { node, existsQuery });
    return existsQuery;
}

export function buildBoolQuery(group: parser.LogicalGroup|parser.FieldGroup): BoolQuery {
    const boolQuery: BoolQuery = {
        bool: {
            filter: [],
            must_not: [],
            should: [],
        }
    };

    for (const conj of group.flow) {
        for (const node of conj.nodes) {
            if (parser.isNegation(node)) {
                const query = buildAnyQuery(node.node);
                if (query) {
                    boolQuery.bool.must_not.push(query);
                }
            } else {
                const query = buildAnyQuery(node);
                if (query && conj.operator === 'OR') {
                    boolQuery.bool.should.push(query);
                }
                if (query && conj.operator === 'AND') {
                    boolQuery.bool.filter.push(query);
                }
            }
        }
    }

    logger.trace('built bool query', boolQuery, group);
    return boolQuery;
}

export function buildNegationQuery(node: parser.Negation): BoolQuery|undefined {
    const query = buildAnyQuery(node.node);
    if (!query) return;

    const result: BoolQuery = {
        bool: {
            filter: [],
            should: [],
            must_not: [query],
        }
    };

    logger.trace('built negation query', node, result);
    return result;
}

export function isBoolQuery(query: any): query is BoolQuery {
    return query && query.bool != null;
}

export function ensureBoolQuery(query?: AnyQuery): BoolQuery|never[] {
    if (!query) return [];
    if (isBoolQuery(query)) return query;

    return {
        bool: {
            filter: [query],
            should: [],
            must_not: []
        }
    };
}

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
