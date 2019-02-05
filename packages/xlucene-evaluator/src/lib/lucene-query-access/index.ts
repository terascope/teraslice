
import _ from 'lodash';
import LuceneQueryParser from '../lucene-query-parser';
import { AST } from '../interfaces';

interface Config {
    exclude: string[];
}

export default class LuceneQueryAccess extends LuceneQueryParser {
    public config: Config;

    constructor(config: Config) {
        super();
        this.config = config;
    }

    restrict(query: string) {
        this.parse(query);
        this.walkLuceneAst((node: AST) => {
            if (!node.field) return;

            const bool = _.some(this.config.exclude, (str) => _.startsWith(node.field, str));

            if (bool) {
                throw new Error(`Field ${node.field} is restricted`);
            }
        });
        return query;
    }
}
