import { TypeConfig } from 'xlucene-evaluator';
import * as ts from '@terascope/utils';
import { TypeESMapping, GraphQLType, FieldTypeConfig } from '../../interfaces';
import { formatGQLComment } from '../../graphql-helper';

export default abstract class BaseType {
    readonly field: string;
    readonly config: FieldTypeConfig;

    constructor(field: string, config: FieldTypeConfig) {
        if (!field || !ts.isString(field)) {
            throw new ts.TSError('A field must be provided and must be of type string');
        }
        this.field = field;
        this.config = config;
    }

    abstract toESMapping(version?: number): TypeESMapping;
    abstract toGraphQL(): GraphQLType;
    abstract toXlucene(): TypeConfig;

    protected _formatGql(
        type: string,
        customType?: string
    ): { type: string; custom_type?: string } {
        const desc = this.config.description;
        if (this.field.includes('.')) {
            const [base] = this.field.split('.');
            if (!ts.isTest) {
                console.warn('[WARNING]: typed nested objects are not supported when converting to graphql\n');
            }
            return {
                type: formatType(`${base}: JSONObject`, desc),
                custom_type: 'scalar JSONObject'
            };
        }

        if (type !== 'JSONObject' && this.config.array) {
            return {
                type: formatType(`${this.field}: [${type}]`, desc),
                custom_type: customType
            };
        }
        return {
            type: formatType(`${this.field}: ${type}`, desc),
            custom_type: customType
        };
    }
}

function formatType(type: string, desc?: string) {
    if (!desc) return type;
    return `${formatGQLComment(desc)}\n${type}`;
}
