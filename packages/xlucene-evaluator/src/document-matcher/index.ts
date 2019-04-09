
import _ from 'lodash';
import { debugLogger } from '@terascope/utils';
import { Parser } from '../parser';
import { bindThis } from '../utils';
import { TypeConfig } from '../interfaces';
import logicBuilder from './logic-builder';

// @ts-ignore
const logger = debugLogger('document-matcher');

export default class DocumentMatcher {
    private filterFn: Function|undefined;
    private typeConfig: TypeConfig|undefined;

    constructor(luceneStr?: string, typeConfig?: TypeConfig) {
        this.typeConfig = typeConfig;
        bindThis(this, DocumentMatcher);

        if (luceneStr) {
            this.parse(luceneStr);
        }
    }
    // TODO: remove this method
    public parse(luceneStr: string, typeConfig?: TypeConfig):void {
        const parser = new Parser(luceneStr);
        const types = typeConfig || this.typeConfig;
        const resultingFN = logicBuilder(parser, types);
        this.filterFn = resultingFN;
    }

    public match(doc:object):boolean {
        if (!this.filterFn) throw new Error('DocumentMatcher must be initialized with a lucene query');
        return this.filterFn(doc);
    }
}
