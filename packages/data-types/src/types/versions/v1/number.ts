
import { Type } from '../../../interfaces';

enum ESType {
    long = 'long',
    integer = 'integer',
    short = 'short',
    byte = 'byte',
    double = 'double',
    float = 'float',
    half_float = 'half_float',
    scaled_float = 'scaled_float',
}

enum GraphqlType {
    float = 'Float',
    int = 'Int'
}

const EStoGraphql = {
    long: GraphqlType.int,
    integer: GraphqlType.int,
    short: GraphqlType.int,
    byte: GraphqlType.int,
    double: GraphqlType.int,
    float: GraphqlType.float,
    half_float: GraphqlType.float,
    scaled_float: GraphqlType.float
};

export default class NumberType implements Type {
    public baseType: string;
    public field: string;
    public type: ESType;

    constructor(field: string, elasticType: ESType) {
        this.baseType = 'String';
        this.field = field;
        this.type = elasticType;
        if (!EStoGraphql[elasticType]) throw new Error(`Number type recieved unrecognized type: ${elasticType}`);
    }

    toESMapping() {
        return { [this.field]: this.type };
    }

    toGraphQl() {
        return `${this.field}: ${EStoGraphql[this.field]}`;
    }

    toXlucene() {
        return { [this.field]: 'number' };
    }
}
