import { TypeConfig } from 'xlucene-evaluator';
import * as ts from '@terascope/utils';
import { ESMapping, GraphQLType, Type } from '../../interfaces';

export default abstract class BaseType {
    protected field: string;
    protected config: Type;

    constructor(field: string, config: Type) {
        if (!field || !ts.isString(field)) throw new ts.TSError('A field must be provided and must be of type string');
        this.field = field;
        this.config = config;
    }

    abstract toESMapping(version?: number): ESMapping;
    abstract toGraphQL(): GraphQLType;
    abstract toXlucene(): TypeConfig;

    protected _formatGql(type: string): string {
        if (this.config.array) {
            return `${this.field}: [${type}]`;
        }
        return `${this.field}: ${type}`;
    }
}
