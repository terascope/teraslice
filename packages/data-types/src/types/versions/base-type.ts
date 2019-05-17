
import { TypeConfig, EsMapping, GraphQLType, XluceneMapping } from '../../interfaces';
import * as ts from '@terascope/utils';

export default abstract class BaseType {
    protected field: string;
    protected config: any;

    constructor(field:string, config: TypeConfig) {
        if (field == null || typeof field !== 'string') throw new ts.TSError('A field must be provided and must be of type string');
        this.field = field;
        this.config = config;
    }

    abstract toESMapping(): EsMapping;
    abstract toGraphQl(): GraphQLType;
    abstract toXlucene(): XluceneMapping;
}
