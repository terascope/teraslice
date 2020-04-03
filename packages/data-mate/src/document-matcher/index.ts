import { debugLogger } from '@terascope/utils';
import { Parser } from 'xlucene-parser';
import { BooleanCB, DocumentMatcherOptions } from './interfaces';
import logicBuilder from './logic-builder';

const _logger = debugLogger('document-matcher');

export default class DocumentMatcher {
    private filterFn: BooleanCB;

    constructor(query: string, options: DocumentMatcherOptions = {}) {
        const config = Object.assign({}, { logger: _logger }, options);
        const parser = new Parser(query, config);

        this.filterFn = logicBuilder(parser, options.type_config);
    }

    public match(doc: object): boolean {
        return this.filterFn(doc);
    }
}
