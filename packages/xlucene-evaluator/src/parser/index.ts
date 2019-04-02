import { debugLogger, Logger, TSError } from '@terascope/utils';
import engine from './engine';

export class Parser {
    ast: V2AST = {};
    query: string;
    logger: Logger;

    constructor(query: string, logger: Logger = debugLogger('parser-v2')) {
        this.logger = logger;
        this.query = query;
        this._parse();
    }

    private _parse() {
        try {
            this.ast = engine.parse(this.query);
            this.logger.trace(`parsed ${this.query} to `, this.ast);
        } catch (err) {
            throw new TSError(err, {
                reason: `Failure to parse xlucene query ${this.query}`
            });
        }
    }
}

export type V2AST = {}|{
    type: 'term';
    data_type: 'string';
    field: string|null;
    value: any;
};
