
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
            const fields = node.field.split('.');
            if (this.config.exclude.includes(fields[0]) || this.config.exclude.includes(node.field)) {
                throw new Error(`Field ${node.field} is restricted`);
            }
        });
        return query;
    }
}
