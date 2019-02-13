import { debugLogger } from '@terascope/utils';
import { TypeConfig, AST } from '../interfaces';
import { parseNodeRange, isRangeNode } from '../utils';
import LuceneQueryParser from '../lucene-query-parser';
import { IMPLICIT } from '../constants';

const logger = debugLogger('translator');

export default class Translator {
    query: string;
    public types?: TypeConfig;
    private parser: LuceneQueryParser;

    constructor(query: string, types?: TypeConfig) {
        this.query = query;
        this.types = types;
        this.parser = new LuceneQueryParser();
        this.parser.parse(query);
    }

    toElasticsearchDSL() {
        logger.debug('parser ast', this.parser._ast);
        const query = this.buildAnyQuery(this.parser._ast);

        const dslQuery = {
            query: {
                constant_score: {
                    filter: query
                }
            }
        };

        logger.debug('final query', JSON.stringify(query, null, 2));
        return dslQuery;
    }

    private buildBoolQuery(node: AST): BoolQuery  {
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
            const query = this.buildAnyQuery(node.left, node);
            queries.push(query);
        }

        if (node.right) {
            const query = this.buildAnyQuery(node.right, node);
            if (isBoolQuery(query) && node.right.operator === node.operator) {
                queries.push(...query.bool.filter);
                queries.push(...query.bool.must_not);
                queries.push(...query.bool.should);
            } else {
                queries.push(query);
            }
        }

        boolQuery.bool[joinType].push(...queries);

        return boolQuery;
    }

    private buildAnyQuery(node: AST, parentNode?: AST): AnyQuery {
        if (node.type === 'operator') {
            const boolQuery = this.buildBoolQuery(node);
            logger.debug('built bool query', node, boolQuery);
            return boolQuery;
        }

        const field = getFieldFromNode(node, parentNode);
        if (!field) {
            const error = new Error('Unable to determine field');
            logger.error(error.message, node, parentNode);
            throw error;
        }

        if (field != null && node.term != null) {
            if (field === '_exists_') {
                const existsQuery: ExistsQuery = {
                    exists: {
                        field: node.term
                    }
                };
                logger.debug('built exists query', node, existsQuery);
                return existsQuery;
            }

            if (node.regexpr) {
                const regexQuery: RegExprQuery = { regexp: {} };
                regexQuery.regexp[field] = node.term;
                logger.debug('built regexpr query', node, regexQuery);
                return regexQuery;
            }

            if (node.wildcard) {
                const wildcardQuery: WildcardQuery = { wildcard: {} };
                wildcardQuery.wildcard[field] = node.term;
                logger.debug('built wildcard query', node, wildcardQuery);
                return wildcardQuery;
            }

            const termQuery: TermQuery = { term: {} };
            termQuery.term[field] = node.term;
            logger.debug('built term query', node, termQuery);
            return termQuery;
        }

        if (isRangeNode(node)) {
            const range = parseNodeRange(node);
            const rangeQuery: RangeQuery = { range: {} };
            rangeQuery.range[field] = range;
            logger.debug('built range query', node, rangeQuery);
            return rangeQuery;
        }

        if (node.type === 'geo') {
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

            logger.debug('built geo query', node, geoQuery);
            return geoQuery;
        }

            // REMOVE ME when done
        throw new Error('Unsupported query');
    }
}

function isBoolQuery(input: any): input is BoolQuery {
    return input && input.bool != null;
}

function getFieldFromNode(node: AST, parentNode?: AST): string|undefined {
    const parentNodeField = _getFieldFromNode(parentNode);
    const nodeField = _getFieldFromNode(node);
    return nodeField || parentNodeField;
}

function _getFieldFromNode(node?: AST): string|undefined {
    if (!node) return;
    if (!node.field) return;
    if (node.field === IMPLICIT) return;
    return node.field;
}

type BoolQuery = {
    bool: {
        filter: AnyQuery[],
        must_not: AnyQuery[],
        should: AnyQuery[],
    }
};

type AnyQuery = BoolQuery|GeoQuery|TermQuery|WildcardQuery|ExistsQuery|RegExprQuery|RangeQuery;

interface ExistsQuery {
    exists: {
        field: string;
    };
}

interface GeoQuery {
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

interface RegExprQuery {
    regexp: {
        [field: string]: string;
    };
}

interface TermQuery {
    term: {
        [field: string]: string|number|boolean;
    };
}

interface WildcardQuery {
    wildcard: {
        [field: string]: string;
    };
}

interface RangeQuery {
    range: {
        [field: string]: RangeExpression
    };
}

interface RangeExpression {
    gte?: string|number;
    lte?: string|number;
    gt?: string|number;
    lt?: string|number;
}
