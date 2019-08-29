
import { debugLogger } from '@terascope/utils';
import { BooleanCB, DocumentMatcherOptions } from './interfaces';
import logicBuilder from './logic-builder';
import { Parser } from '../parser';

const _logger = debugLogger('document-matcher');

export default class DocumentMatcher {
    private filterFn: BooleanCB;

    constructor(query: string, options: DocumentMatcherOptions = {}) {
        const logger = options.logger != null
            ? options.logger.child({ module: 'document-matcher' })
            : _logger;

        const parser = new Parser(query, {
            type_config: options.type_config,
            logger,
        });

        this.filterFn = logicBuilder(parser, options.type_config);
    }

    public match(doc: object): boolean {
        return this.filterFn(doc);
    }
}
