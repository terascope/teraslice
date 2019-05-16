
import { TypeConfig } from '../../interfaces';

export default abstract class BaseType {
    protected field: string;
    protected config: any;

    constructor(field:string, config: TypeConfig) {
        this.field = field;
        this.config = config;
    }

    abstract toESMapping(): any;
    abstract toGraphQl(): any;
    abstract toXlucene(): any;
}
