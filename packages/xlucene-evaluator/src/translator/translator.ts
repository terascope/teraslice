import { debugLogger, isString } from '@terascope/utils';
import { TypeConfig } from '../interfaces';
import { Parser, isEmptyAST } from '../parser';
import * as i from './interfaces';
import * as utils from './utils';

const logger = debugLogger('xlucene-translator');

export class Translator {
    query: string;
    public types?: TypeConfig;
    private parser: Parser;

    static toElasticsearchDSL(query: string|Parser, types?: TypeConfig) {
        return new Translator(query, types).toElasticsearchDSL();
    }

    constructor(input: string|Parser, types?: TypeConfig) {
        if (isString(input)) {
            this.parser = new Parser(input);
        } else {
            this.parser = input;
        }
        this.query = this.parser.query;
        this.types = types;
    }

    toElasticsearchDSL(): i.ElasticsearchDSLResult {
        if (isEmptyAST(this.parser.ast)) {
            return {
                query: {
                    query_string: {
                        query: ''
                    }
                }
            };
        }

        const anyQuery = utils.buildAnyQuery(this.parser.ast, this.parser);

        const query = {
            constant_score: {
                filter: utils.compactFinalQuery(anyQuery),
            },
        };

        logger.trace(`translated ${this.query} query to`, JSON.stringify(query, null, 2));

        return { query };
    }
}
