import { TypeConfig } from 'xlucene-evaluator';
import * as ts from '@terascope/utils';

import { ESMapping, GraphQLType } from '../../interfaces';

export default abstract class BaseType {
    protected field: string;
    protected config: any;

    constructor(field: string, config: any) {
        if (field == null || typeof field !== 'string') throw new ts.TSError('A field must be provided and must be of type string');
        this.field = field;
        this.config = config;
    }

    abstract toESMapping(version?: number): ESMapping;
    abstract toGraphQL(): GraphQLType;
    abstract toXlucene(): TypeConfig;
}
