

import { DocumentMatcher } from 'xlucene-evaluator';
import { DataEntity } from '@terascope/job-components';
import OperationBase from '../base';
import { OperationConfig } from '../../../interfaces';

export default class Selector extends OperationBase {
    private documentMatcher: DocumentMatcher;
    public selector: string;
    private isMatchAll: boolean;

    constructor(config: OperationConfig, typeConfigs?: object) {
        super();
        let luceneQuery = config.selector as string;
        this.selector = luceneQuery;
        this.isMatchAll = luceneQuery === '*';
        if (this.isMatchAll) luceneQuery = '';
        this.documentMatcher = new DocumentMatcher(luceneQuery, typeConfigs)
    }

    addMetaData(doc: DataEntity, selector: string) {
        const meta = doc.getMetadata('selectors');
        if (meta) {
            meta[selector] = true;
            doc.setMetadata('selectors', meta)
        } else {
            const metadata = {};
            metadata[selector] = true;
            doc.setMetadata('selectors', metadata)
        }
    }

    run(doc: DataEntity | null): DataEntity | null {
        const { selector, addMetaData, documentMatcher, isMatchAll} = this;
        if (!doc) return doc;
        if (isMatchAll || documentMatcher.match(doc)) {
            addMetaData(doc, selector)
            return doc
        };
        return null;
    }
}
