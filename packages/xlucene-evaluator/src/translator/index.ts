import { TypeConfig } from '../interfaces';
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
        const dslQuery = {
            query: {
                bool: {
                    filter: [] as AnyQuery[],
                    must: [] as AnyQuery[]
                }
            }
        };

        const filter = dslQuery.query.bool.filter;
        const must = dslQuery.query.bool.must;

        this.parser.walkLuceneAst((node) => {
            if (node.field && node.term) {
                if (node.field === '_exists_') {
                    const existsQuery: ExistsQuery = {
                        exists: {
                            field: node.term
                        }
                    };
                    filter.push(existsQuery);
                } else if (node.regexpr) {
                    const regexQuery: RegExprQuery = { regexp: {} };
                    regexQuery.regexp[node.field] = node.term;
                    filter.push(regexQuery);
                } else if (node.wildcard) {
                    const wildcardQuery: WildcardQuery = { wildcard: {} };
                    wildcardQuery.wildcard[node.field] = node.term;
                    filter.push(wildcardQuery);
                } else {
                    const termQuery: TermQuery = { term: {} };
                    termQuery.term[node.field] = node.term;
                    filter.push(termQuery);
                }
            }

            if (isRangeNode(node)) {
                const range = parseNodeRange(node);
                const rangeQuery: RangeQuery = { range: {} };
                rangeQuery.range[node.field] = range;
                filter.push(rangeQuery);
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

                must.push(geoQuery);
            }
        });

        return dslQuery;
    }
}

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
