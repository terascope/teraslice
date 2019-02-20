import { debugLogger } from '@terascope/utils';
import * as utils from '../utils';
import { AST, IMPLICIT } from '../interfaces';

const logger = debugLogger('xlucene-translator-utils');

export function buildAnyQuery(node: AST, parentNode?: AST): AnyQuery {
    if (utils.isConjunctionNode(node)) {
        return buildBoolQuery(node);
    }

    const field = getFieldFromNode(node, parentNode);
    if (!field) {
        const error = new Error('Unable to determine field');
        logger.error(error.message, node, parentNode);
        throw error;
    }

    if (utils.isExistsNode(node)) {
        return buildExistsQuery(node, field);
    }

    if (utils.isTermNode(node)) {
        return buildTermQuery(node, field);
    }

    if (utils.isRangeNode(node)) {
        return buildRangeQuery(node, field);
    }

    if (utils.isGeoNode(node)) {
        return buildGeoQuery(node, field);
    }

    // REMOVE ME when done
    throw new Error('Unsupported query');
}

export function buildGeoQuery(node: AST, field: string): GeoQuery {
    const geoQuery: GeoQuery = {};
    if (node.geo_box_top_left != null && node.geo_box_bottom_right != null) {
        geoQuery['geo_bounding_box'] = {};
        geoQuery['geo_bounding_box'][field] = {
            top_left:  node.geo_box_top_left,
            bottom_right: node.geo_box_bottom_right
        };
    }

    if (node.geo_distance != null && node.geo_point != null) {
        geoQuery['geo_distance'] = {
            distance: node.geo_distance,
        };
        geoQuery['geo_distance'][field] = node.geo_point;
    }

    logger.trace('built geo query', { node, geoQuery });
    return geoQuery;
}

export function buildRangeQuery(node: AST, field: string): RangeQuery {
    const range = utils.parseNodeRange(node);
    const rangeQuery: RangeQuery = { range: {} };
    rangeQuery.range[field] = range;
    logger.trace('built range query', { node, rangeQuery });
    return rangeQuery;
}

export function buildTermQuery(node: AST, field: string): TermQuery|RegExprQuery|WildcardQuery {
    if (utils.isRegexNode(node)) {
        return buildRegExprQuery(node, field);
    }

    if (utils.isWildcardNode(node)) {
        return buildWildCardQuery(node, field);
    }

    const termQuery: TermQuery = { term: {} };
    termQuery.term[field] = node.term;
    logger.trace('built term query', node, termQuery);
    return termQuery;
}

export function buildWildCardQuery(node: AST, field: string): WildcardQuery {
    const wildcardQuery: WildcardQuery = { wildcard: {} };
    wildcardQuery.wildcard[field] = node.term;
    logger.trace('built wildcard query', { node, wildcardQuery });
    return wildcardQuery;
}

export function buildRegExprQuery(node: AST, field: string): RegExprQuery {
    const regexQuery: RegExprQuery = { regexp: {} };
    regexQuery.regexp[field] = node.term;
    logger.trace('built regexpr query', { node, regexQuery });
    return regexQuery;
}

export function buildExistsQuery(node: AST, field: string): ExistsQuery {
    const existsQuery: ExistsQuery = {
        exists: {
            field
        }
    };
    logger.trace('built exists query', { node, existsQuery });
    return existsQuery;
}

export function buildBoolQuery(node: AST): BoolQuery {
    const boolQuery: BoolQuery = {
        bool: {
            filter: [],
            must_not: [],
            should: [],
        }
    };

    let joinType;
    if (node.operator === 'OR') {
        joinType = 'should';
    } else if (node.operator === 'NOT') {
        joinType = 'must_not';
    } else {
        joinType = 'filter';
    }

    const queries: AnyQuery[] = [];

    if (node.left) {
        const query = buildAnyQuery(node.left, node);
        queries.push(query);
    }

    if (node.right) {
        const query = buildAnyQuery(node.right, node);
        if (isBoolQuery(query) && canFlattenBoolQuery(node)) {
            queries.push(...query.bool.filter);
            queries.push(...query.bool.must_not);
            queries.push(...query.bool.should);
        } else {
            queries.push(query);
        }
    }

    boolQuery.bool[joinType].push(...queries);

    logger.trace('built bool query', { node, boolQuery });
    return boolQuery;
}

export function canFlattenBoolQuery(node: AST): boolean {
    if (!node.right || node.right.parens) return false;
    return node.right.operator === node.operator;
}

export function isBoolQuery(query: any): query is BoolQuery {
    return query && query.bool != null;
}

export function getFieldFromNode(node: AST, parentNode?: AST): string|undefined {
    const parentNodeField = _getFieldFromNode(parentNode);
    const nodeField = _getFieldFromNode(node);
    return nodeField || parentNodeField;
}

export function _getFieldFromNode(node?: AST): string|undefined {
    if (!node) return;
    if (!node.field) return;
    if (node.field === IMPLICIT) return;
    return node.field;
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
            top_left: string;
            bottom_right: string;
        }
    };
    geo_distance?: {
        distance: string;
        [field: string]: string;
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
