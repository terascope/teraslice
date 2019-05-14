
import { Type } from '../../../interfaces';

const aliases = ['keyword', 'text'];

enum ESType {
    keyword = 'keyword',
    text = 'text',
}

export default class StringType implements Type {
    public baseType: string;
    public field: string;
    public type: ESType;

    constructor(field: string, elasticType: ESType) {
        this.baseType = 'String';
        this.field = field;
        this.type = elasticType;
        if (!aliases.includes(elasticType)) throw new Error(`String type recieved unrecognized type: ${elasticType}`);
    }

    toESMapping() {
        return { [this.field]: this.type };
    }

    toGraphQl() {
        return `${this.field}: String`;
    }

    toXlucene() {
        return { [this.field]: 'string' };
    }
}
