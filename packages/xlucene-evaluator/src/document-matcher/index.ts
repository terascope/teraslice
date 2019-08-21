
import { debugLogger, Logger } from '@terascope/utils';
import { Parser } from '../parser';
import { TypeConfig, BooleanCB } from '../interfaces';
import logicBuilder from './logic-builder';

const _logger = debugLogger('document-matcher');

export default class DocumentMatcher {
    private logger: Logger;
    private filterFn: BooleanCB;
    readonly typeConfig: TypeConfig|undefined;

    constructor(luceneStr: string, typeConfig?: TypeConfig, logger?: Logger) {
        this.logger = logger != null ? logger.child({ module: 'document-matcher' }) : _logger;
        this.typeConfig = typeConfig;
        const parser = new Parser(luceneStr, typeConfig, this.logger);
        this.filterFn = logicBuilder(parser, typeConfig);
    }

    public match(doc:object):boolean {
        return this.filterFn(doc);
    }
}
