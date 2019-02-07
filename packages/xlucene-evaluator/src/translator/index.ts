
import { TypeConfig } from '../interfaces';
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
                    filter: [] as AnyQuery[]
                }
            }
        };

        const filter = dslQuery.query.bool.filter;

        this.parser.walkLuceneAst((node) => {
            if (node.field && node.term) {
                if (node.field === '_exists_') {
                    const existsQuery: ExistsQuery = {
                        exists: {
                            field: node.term as string
                        }
                    };
                    filter.push(existsQuery);
                } else if (node.regexpr) {
                    const regexQuery: RegExprQuery = { regexp: {} };
                    regexQuery.regexp[node.field] = node.term as string;
                    filter.push(regexQuery);
                } else if (node.wildcard) {
                    const wildcardQuery: WildcardQuery = { wildcard: {} };
                    wildcardQuery.wildcard[node.field] = node.term as string;
                    filter.push(wildcardQuery);
                } else {
                    const termQuery: TermQuery = { term: {} };
                    termQuery.term[node.field] = node.term;
                    filter.push(termQuery);
                }
            }
            if (node.term_min) {
                const rangeQuery: RangeQuery = {
                    range: {}
                };
                rangeQuery.range[node.field] = {};
                const rangeField = rangeQuery.range[node.field];
                if (node.term_max === Infinity && node.inclusive_min) {
                    rangeField['gte'] = node.term_min;
                } else if (node.term_max === Infinity && !node.inclusive_min) {
                    rangeField['gt'] = node.term_min;
                } else if (node.term_min === -Infinity && node.inclusive_max) {
                    rangeField['lte'] = node.term_max;
                } else if (node.term_min === -Infinity && !node.inclusive_max) {
                    rangeField['lt'] = node.term_max;
                }
                filter.push(rangeQuery);
            }
        });

        return dslQuery;
    }
}

type AnyQuery = TermQuery|WildcardQuery|ExistsQuery|RegExprQuery|RangeQuery;

interface ExistsQuery {
    exists: {
        field: string;
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
