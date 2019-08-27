import { TypeConfig } from 'xlucene-evaluator';
import * as ts from '@terascope/utils';
import { TypeESMapping, GraphQLType, FieldTypeConfig } from '../../interfaces';

export default abstract class BaseType {
    protected field: string;
    protected config: FieldTypeConfig;

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
        if (this.field.includes('.')) {
            const [base] = this.field.split('.');
            if (!ts.isTest) {
                console.warn('[WARNING]: typed nested objects are not supported when converting to graphql\n');
            }
            return { type: `${base}: JSON`, custom_type: 'scalar JSON' };
        }

        if (type !== 'JSON' && this.config.array) {
            return { type: `${this.field}: [${type}]`, custom_type: customType };
        }
        return { type: `${this.field}: ${type}`, custom_type: customType };
    }
}
