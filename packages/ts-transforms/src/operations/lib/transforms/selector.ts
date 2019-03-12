
import { DocumentMatcher, TypeConfig } from 'xlucene-evaluator';
import { DataEntity } from '@terascope/utils';
import TransformOpBase from './base';
import { OperationConfig } from '../../../interfaces';

export default class Selector extends TransformOpBase {
    private documentMatcher: DocumentMatcher;
    public selector: string;
    private isMatchAll: boolean;

    constructor(config: OperationConfig, types?: TypeConfig) {
        super(config);
        let luceneQuery = config.selector as string;
        if (typeof luceneQuery !== 'string') throw new Error('selector must be a string');
        this.selector = luceneQuery;
        this.isMatchAll = luceneQuery === '*';
        if (this.isMatchAll) luceneQuery = '';
        this.documentMatcher = new DocumentMatcher(luceneQuery, types);
    }

    addMetaData(doc: DataEntity, selector: string) {
        const meta = doc.getMetadata('selectors');
        if (meta) {
            meta.push(selector);
        } else {
            doc.setMetadata('selectors', [selector]);
        }
    }

    run(doc: DataEntity): DataEntity | null {
        if (this.isMatchAll || this.documentMatcher.match(doc)) {
            this.addMetaData(doc, this.selector);
            return doc;
        }
        return null;
    }
}
