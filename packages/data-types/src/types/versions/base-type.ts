
import { TypeConfig, EsMapping, GraphQLType, XluceneMapping } from '../../interfaces';

export default abstract class BaseType {
    protected field: string;
    protected config: any;

    constructor(field:string, config: TypeConfig) {
        this.field = field;
        this.config = config;
    }

    abstract toESMapping(): EsMapping;
    abstract toGraphQl(): GraphQLType;
    abstract toXlucene(): XluceneMapping;
}
