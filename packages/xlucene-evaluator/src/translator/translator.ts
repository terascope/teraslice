import { debugLogger, trim } from '@terascope/utils';
import { TypeConfig } from '../interfaces';
import { Parser } from '../parser';
import * as i from './interfaces';
import * as utils from './utils';

const logger = debugLogger('xlucene-translator');

export class Translator {
    query: string;
    public types?: TypeConfig;
    private parser: Parser;

    static toElasticsearchDSL(query: string, types?: TypeConfig) {
        return new Translator(query, types).toElasticsearchDSL();
    }

    constructor(query: string, types?: TypeConfig) {
        this.query = trim(query);
        this.types = types;
        this.parser = new Parser(this.query);
    }

    toElasticsearchDSL(): i.ElasticsearchDSLResult {
        if (!this.query) {
            return {
                query: {
                    query_string: {
                        query: ''
                    }
                }
            };
        }

        const query = utils.buildAnyQuery(this.parser.ast);
        logger.trace(`translated ${this.query} query to`, JSON.stringify(query));

        return {
            query: {
                constant_score: {
                    filter: utils.ensureBoolQuery(query),
                },
            }
        };
    }
}
