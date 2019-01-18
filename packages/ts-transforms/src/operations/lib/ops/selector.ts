
import { DocumentMatcher } from 'xlucene-evaluator';
import { DataEntity } from '@terascope/job-components';
import OperationBase from '../base';
import { OperationConfig, SelectorTypes } from '../../../interfaces';

export default class Selector extends OperationBase {
    private documentMatcher: DocumentMatcher;
    public selector: string;
    private isMatchAll: boolean;

    constructor(config: OperationConfig, types?: SelectorTypes) {
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
            meta[selector] = true;
            doc.setMetadata('selectors', meta);
        } else {
            const metadata = {};
            metadata[selector] = true;
            doc.setMetadata('selectors', metadata);
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
