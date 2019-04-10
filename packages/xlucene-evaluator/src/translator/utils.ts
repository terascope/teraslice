import { debugLogger, TSError } from '@terascope/utils';
import * as parser from '../parser';
import * as i from './interfaces';
import { parseRange } from '../utils';

const logger = debugLogger('xlucene-translator-utils');

export function buildAnyQuery(node: parser.AST): i.AnyQuery|undefined {
    const field = parser.getField(node);
    if (parser.isWildcard(node) && !node.field && node.value === '*') {
        return {
            bool: {
                filter: []
            }
        };
    }

    if (parser.isGroupLike(node)) {
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

export function buildGeoBoundingBoxQuery(node: parser.GeoBoundingBox, field: string): i.GeoQuery {
    const geoQuery: i.GeoQuery = {};
    geoQuery['geo_bounding_box'] = {};
    geoQuery['geo_bounding_box'][field] = {
        top_left:  node.top_left,
        bottom_right: node.bottom_right
    };

    logger.trace('built geo bounding box query', { node, geoQuery });
    return geoQuery;
}

export function buildGeoDistanceQuery(node: parser.GeoDistance, field: string): i.GeoQuery {
    const geoQuery: i.GeoQuery = {};
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

export function buildRangeQuery(node: parser.Range, field: string): i.RangeQuery {
    const rangeQuery: i.RangeQuery = { range: {} };
    rangeQuery.range[field] = parseRange(node);
    logger.trace('built range query', { node, rangeQuery });
    return rangeQuery;
}

export function buildTermQuery(node: parser.Term, field: string): i.TermQuery|i.RegExprQuery|i.WildcardQuery {
    const termQuery: i.TermQuery = { term: {} };
    termQuery.term[field] = node.value;
    logger.trace('built term query', node, termQuery);
    return termQuery;
}

export function buildWildcardQuery(node: parser.Wildcard, field: string): i.WildcardQuery {
    const wildcardQuery: i.WildcardQuery = { wildcard: {} };
    wildcardQuery.wildcard[field] = node.value;
    logger.trace('built wildcard query', { node, wildcardQuery });
    return wildcardQuery;
}

export function buildRegExprQuery(node: parser.Regexp, field: string): i.RegExprQuery {
    const regexQuery: i.RegExprQuery = { regexp: {} };
    regexQuery.regexp[field] = node.value;
    logger.trace('built regexpr query', { node, regexQuery });
    return regexQuery;
}

export function buildExistsQuery(node: parser.Exists, field: string): i.ExistsQuery {
    const existsQuery: i.ExistsQuery = {
        exists: {
            field
        }
    };
    logger.trace('built exists query', { node, existsQuery });
    return existsQuery;
}

export function buildBoolQuery(group: parser.GroupLikeAST): i.BoolQuery|undefined {
    const should: i.AnyQuery[] = [];

    for (const conj of group.flow) {
        const query = buildConjunctionQuery(conj);
        should.push(...flattenQuery(query, 'should'));
    }
    if (!should.length) return;

    const boolQuery: i.BoolQuery = {
        bool: {
            should
        }
    };

    logger.trace('built bool query', boolQuery, group);
    return boolQuery;
}

export function buildConjunctionQuery(conj: parser.Conjunction): i.BoolQuery {
    const filter: i.AnyQuery[] = [];
    for (const node of conj.nodes) {
        const query = buildAnyQuery(node);
        filter.push(...flattenQuery(query, 'filter'));
    }

    return {
        bool: {
            filter,
        }
    };
}

export function flattenQuery(query: i.AnyQuery|undefined, flattenTo: i.BoolQueryTypes): i.AnyQuery[] {
    if (!query) return [];
    if (isBoolQuery(query) && canFlattenBoolQuery(query, flattenTo)) {
        return query.bool[flattenTo]!;
    }
    return [query];
}

/** This prevents double nested queries that do the same thing */
export function canFlattenBoolQuery(query: i.BoolQuery, flattenTo: i.BoolQueryTypes) {
    const types = Object.keys(query.bool);
    if (types.length !== 1) return false;
    return types[0] === flattenTo;
}

export function buildNegationQuery(node: parser.Negation): i.BoolQuery|undefined {
    const query = buildAnyQuery(node.node);
    if (!query) return;

    const mustNot = flattenQuery(query, 'must_not');
    logger.trace('built negation query', mustNot, node);
    return {
        bool: {
            must_not: mustNot
        }
    };
}

export function isBoolQuery(query: any): query is i.BoolQuery {
    return query && query.bool != null;
}

export function compactFinalQuery(query?: i.AnyQuery): i.AnyQuery|i.AnyQuery[] {
    if (!query) return [];
    if (isBoolQuery(query) && canFlattenBoolQuery(query, 'filter')) {
        const filter = query.bool.filter!;
        if (!filter.length) return query;
        if (filter.length === 1) {
            return filter[0];
        }
        return filter;
    }
    return query;
}
