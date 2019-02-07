
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
                if (node.wildcard) {
                    const wildcardQuery: WildcardQuery = { wildcard: {} };
                    wildcardQuery.wildcard[node.field] = node.term as string;
                    filter.push(wildcardQuery);
                } else {
                    const termQuery: TermQuery = { term: {} };
                    termQuery.term[node.field] = node.term;
                    filter.push(termQuery);
                }
            }
        });

        return dslQuery;
    }
}

type AnyQuery = TermQuery|WildcardQuery;

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
