import LuceneQueryParser from '../lucene-query-parser';
export default class DocumentMatcher extends LuceneQueryParser {
    private filterFn;
    private types;
    constructor(luceneStr?: string, typeConfig?: any);
    parse(luceneStr: string, typeConfig?: any): void;
    private _buildFilterFn;
    private _parseRange;
    match(doc: object): any;
}
