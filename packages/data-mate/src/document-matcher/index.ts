import { Parser } from 'xlucene-parser';
import type { BooleanCB, DocumentMatcherOptions } from './interfaces.js';
import logicBuilder from './logic-builder/index.js';

export class DocumentMatcher {
    private filterFn: BooleanCB;

    constructor(query: string, options: DocumentMatcherOptions = {}) {
        const parser = new Parser(query, {
            type_config: options.type_config,
            filterNilVariables: options.filterNilVariables,
            variables: options.variables
        });

        this.filterFn = logicBuilder(parser, options.type_config);
    }

    public match(doc: Record<string, any>): boolean {
        return this.filterFn(doc);
    }
}
