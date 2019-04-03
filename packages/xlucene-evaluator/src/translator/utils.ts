import { debugLogger, TSError } from '@terascope/utils';
import * as utils from '../utils';
import { AST, IMPLICIT } from '../interfaces';

const logger = debugLogger('xlucene-translator-utils');

export function buildAnyQuery(node: AST, parentNode?: AST): AnyQuery|undefined {
    const field = getFieldFromNode(node, parentNode);
    if (!field && node.term === '*') {
        return;
    }

    if (utils.isConjunctionNode(node)) {
        return buildBoolQuery(node);
    }

    if (!field) {
        const error = new TSError('Unexpected problem when translating xlucene query', {
            context: {
                node,
                parentNode,
            },
        });
        logger.error(error);
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

    logger.error(new Error('unsupport ast node'), node);
    return undefined;
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

    addToBoolQuery(boolQuery, node, 'left');
    addToBoolQuery(boolQuery, node, 'right');

    logger.trace('built bool query', boolQuery, node);
    return boolQuery;
}

function addToBoolQuery(boolQuery: BoolQuery, node: AST, side: 'right'|'left') {
    const child = node[side];
    if (!child) return;

    const joinType = getJoinType(node, side);
    const query = buildAnyQuery(child, node);
    const parentJoinType = getJoinType(node);

    if (isBoolQuery(query) && (joinType === parentJoinType || canFlattenBoolQuery(node))) {
        boolQuery.bool.filter.push(...query.bool.filter);
        boolQuery.bool.must_not.push(...query.bool.must_not);
        boolQuery.bool.should.push(...query.bool.should);
    } else if (query) {
        boolQuery.bool[joinType].push(query);
    }
}

export function getJoinType(node: AST, side?: 'right'|'left'): 'should'|'must_not'|'filter' {
    const child = side && node[side] ? node[side]! : node;
    if (child.negated) return 'must_not';
    if (isOrNode(child)) return 'should';
    if (child.parens && child.operator === 'OR') {
        return 'should';
    }
    if (isOrNode(child.left) && (!node.right || isOrNode(child.right))) return 'should';
    if (node.parens && node.negated) return 'must_not';

    return 'filter';
}

function isOrNode(node?: AST): boolean {
    return !!(node && (node.or || node.operator === 'OR'));
}

export function canFlattenBoolQuery(node: AST): boolean {
    const operator = node.operator;
    if (operator === 'OR' && node.left && node.left.field !== IMPLICIT) return false;

    if (node.type === 'conjunction' && !node.parens) {
        return true;
    }

    return false;
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
