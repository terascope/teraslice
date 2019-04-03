import { debugLogger, trim } from '@terascope/utils';
import { TypeConfig } from '../interfaces';
import LuceneQueryParser from '../lucene-query-parser';
import { buildAnyQuery, AnyQuery } from './utils';

const logger = debugLogger('xlucene-translator');

export default class Translator {
    query: string;
    public types?: TypeConfig;
    private parser: LuceneQueryParser;

    static toElasticsearchDSL(query: string, types?: TypeConfig) {
        return new Translator(query, types).toElasticsearchDSL();
    }

    constructor(query: string, types?: TypeConfig) {
        this.query = trim(query);
        this.types = types;
        this.parser = new LuceneQueryParser();
        this.parser.parse(this.query);
    }

    toElasticsearchDSL(): ElasticsearchDSLResult {
        if (!this.query) {
            return {
                query: {
                    query_string: {
                        query: ''
                    }
                }
            };
        }

        const query = buildAnyQuery(this.parser._ast);
        const dslQuery = {
            query: {
                constant_score: {
                    filter: query || []
                }
            }
        };

        logger.trace(`translated ${this.query} query to`, JSON.stringify(query));
        return dslQuery;
    }
}

export interface ElasticsearchDSLResult {
    query: {
        constant_score: {
            filter: AnyQuery | never[];
        }
    } | {
        query_string: {
            query: ''
        }
    };
}
