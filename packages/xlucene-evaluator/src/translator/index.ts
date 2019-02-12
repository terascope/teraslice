import { TypeConfig, AST } from '../interfaces';
import { parseNodeRange, isRangeNode } from '../utils';
import LuceneQueryParser from '../lucene-query-parser';

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
        const boolQuery = this.buildBoolQuery(this.parser._ast);

        const dslQuery = {
            query: {
                constant_score: {
                    filter: boolQuery
                }
            }
        };

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

        if (node.type === 'operator') {
            const { operator = 'AND' } = node;
            if (operator === 'AND') {
                if (node.left) {
                    const query = node.left.type === 'operator' ? this.buildBoolQuery(node.left) : this.buildAnyQuery(node.left);
                    boolQuery.bool.filter.push(query);
                }
                if (node.right) {
                    const query = node.right.type === 'operator' ? this.buildBoolQuery(node.right) : this.buildAnyQuery(node.right);
                    boolQuery.bool.filter.push(query);
                }
            }
        } else {
            boolQuery.bool.filter.push(this.buildAnyQuery(node));
        }

        return boolQuery;
    }

    private buildAnyQuery(node: AST): AnyQuery {
        if (node.field != null && node.term != null) {
            if (node.field === '_exists_') {
                const existsQuery: ExistsQuery = {
                    exists: {
                        field: node.term
                    }
                };
                return existsQuery;
            }  if (node.regexpr) {
                const regexQuery: RegExprQuery = { regexp: {} };
                regexQuery.regexp[node.field] = node.term;
                return regexQuery;
            }  if (node.wildcard) {
                const wildcardQuery: WildcardQuery = { wildcard: {} };
                wildcardQuery.wildcard[node.field] = node.term;
                return wildcardQuery;
            }

            const termQuery: TermQuery = { term: {} };
            termQuery.term[node.field] = node.term;
            return termQuery;
        }

        if (isRangeNode(node)) {
            const range = parseNodeRange(node);
            const rangeQuery: RangeQuery = { range: {} };
            rangeQuery.range[node.field] = range;
            return rangeQuery;
        }

        if (node.type === 'geo') {
            const geoQuery: GeoQuery = {};
            if (node.geo_box_top_left != null && node.geo_box_bottom_right != null) {
                geoQuery['geo_bounding_box'] = {};
                geoQuery['geo_bounding_box'][node.field] = {
                    top_left:  node.geo_box_top_left,
                    bottom_right: node.geo_box_bottom_right
                };
            }

            if (node.geo_distance != null && node.geo_point != null) {
                geoQuery['geo_distance'] = {
                    distance: node.geo_distance,
                };
                geoQuery['geo_distance'][node.field] = node.geo_point;
            }

            return geoQuery;
        }

            // REMOVE ME when done
        throw new Error('Unsupported query');
    }
}

type BoolQuery = {
    bool: {
        filter: (AnyQuery|BoolQuery)[],
        must_not: (AnyQuery|BoolQuery)[],
        should: (AnyQuery|BoolQuery)[],
    }
};

type AnyQuery = GeoQuery|TermQuery|WildcardQuery|ExistsQuery|RegExprQuery|RangeQuery;

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
