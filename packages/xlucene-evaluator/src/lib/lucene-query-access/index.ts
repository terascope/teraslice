
import _ from 'lodash';
import LuceneQueryParser from '../lucene-query-parser';
import { AST } from '../interfaces';

interface Config {
    exclude?: string[];
    include?: string[];
}

export default class LuceneQueryAccess {
    public exclude: string[];
    public include: string[];
    private _parser: LuceneQueryParser;

    constructor(config: Config) {
        const { exclude = [], include = [] } = config;
        this.exclude = exclude;
        this.include = include;

        this._parser = new LuceneQueryParser();
    }

    restrict(query: string): string {
        this._parser.parse(query);
        this._parser.walkLuceneAst((node: AST) => {
            if (!node.field) return;

            const excluded = _.some(this.exclude, (str) => _.startsWith(node.field, str));

            if (excluded) {
                throw new Error(`Field ${node.field} is restricted`);
            }

            if (!this.include.length) return;

            const included = _.some(this.include, (str) => _.startsWith(node.field, str));

            if (!included) {
                throw new Error(`Field ${node.field} is restricted`);
            }
        });

        return query;
    }
}
