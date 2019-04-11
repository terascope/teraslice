import { debugLogger, isString } from '@terascope/utils';
import { TypeConfig } from '../interfaces';
import { Parser, isEmptyAST } from '../parser';
import * as i from './interfaces';
import * as utils from './utils';

const logger = debugLogger('xlucene-translator');

export class Translator {
    readonly query: string;
    public readonly typeConfig?: TypeConfig;
    private readonly _parser: Parser;

    constructor(input: string|Parser, typeConfig?: TypeConfig) {
        if (isString(input)) {
            this._parser = new Parser(input);
        } else {
            this._parser = input;
        }
        this.query = this._parser.query;
        this.typeConfig = typeConfig;
    }

    toElasticsearchDSL(): i.ElasticsearchDSLResult {
        if (isEmptyAST(this._parser.ast)) {
            return {
                query: {
                    query_string: {
                        query: ''
                    }
                }
            };
        }

        const anyQuery = utils.buildAnyQuery(this._parser.ast, this._parser);

        const query = {
            constant_score: {
                filter: utils.compactFinalQuery(anyQuery),
            },
        };

        logger.trace(`translated ${this.query} query to`, JSON.stringify(query, null, 2));

        return { query };
    }
}
