
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
            if (isFieldExcluded(this.exclude, node.field)) {
                throw new Error(`Field ${node.field} is restricted`);
            }

            if (isFieldIncluded(this.include, node.field)) {
                throw new Error(`Field ${node.field} is restricted`);
            }
        });

        return query;
    }
}

function isFieldExcluded(exclude: string[], field?: string): boolean {
    if (!exclude.length || !field) return false;
    return _.some(exclude, (str) => _.startsWith(field, str));
}

function isFieldIncluded(include: string[], field?: string): boolean {
    if (!include.length || !field) return false;
    return !_.some(include, (str) => _.startsWith(field, str));
}
