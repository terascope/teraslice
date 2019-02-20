import { debugLogger } from '@terascope/utils';
import { TypeConfig } from '../interfaces';
import LuceneQueryParser from '../lucene-query-parser';
import { buildAnyQuery } from './utils';

const logger = debugLogger('xlucene-translator');

export default class Translator {
    query: string;
    public types?: TypeConfig;
    private parser: LuceneQueryParser;

    static toElasticsearchDSL(query: string, types?: TypeConfig) {
        return new Translator(query, types).toElasticsearchDSL();
    }

    constructor(query: string, types?: TypeConfig) {
        this.query = query;
        this.types = types;
        this.parser = new LuceneQueryParser();
        this.parser.parse(query);
    }

    toElasticsearchDSL() {
        const query = buildAnyQuery(this.parser._ast);

        const dslQuery = {
            query: {
                constant_score: {
                    filter: query || []
                }
            }
        };

        logger.debug(`translated ${this.query} query to`, JSON.stringify(query, null, 2));
        return dslQuery;
    }
}
