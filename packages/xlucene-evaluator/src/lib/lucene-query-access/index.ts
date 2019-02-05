
import _ from 'lodash';
import LuceneQueryParser from '../lucene-query-parser';
import { AST } from '../interfaces';

interface Config {
    exclude?: string[];
}

export default class LuceneQueryAccess {
    public exclude: string[];
    private _parser: LuceneQueryParser;

    constructor(config: Config) {
        const { exclude = [] } = config;
        this.exclude = exclude;
        this._parser = new LuceneQueryParser();
    }

    restrict(query: string): string {
        this._parser.parse(query);
        this._parser.walkLuceneAst((node: AST) => {
            if (!node.field) return;

            const restricted = _.some(this.exclude, (str) => _.startsWith(node.field, str));

            if (restricted) {
                throw new Error(`Field ${node.field} is restricted`);
            }
        });

        return query;
    }
}
