
import _ from 'lodash';
import { debugLogger } from '@terascope/utils';
import { Parser } from '../parser';
import { bindThis } from '../utils';
import { TypeConfig, BooleanCB } from '../interfaces';
import logicBuilder from './logic-builder';

// @ts-ignore
const logger = debugLogger('document-matcher');

export default class DocumentMatcher {
    private filterFn: BooleanCB;
    readonly typeConfig: TypeConfig|undefined;

    constructor(luceneStr: string, typeConfig?: TypeConfig) {
        this.typeConfig = typeConfig;
        bindThis(this, DocumentMatcher);
        const parser = new Parser(luceneStr);
        this.filterFn = logicBuilder(parser, typeConfig);
    }

    public match(doc:object):boolean {
        return this.filterFn(doc);
    }
}
