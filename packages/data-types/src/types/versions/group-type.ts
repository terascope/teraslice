import { TypeConfig } from 'xlucene-evaluator';
import * as ts from '@terascope/utils';
import { TypeESMapping, GraphQLType, FieldTypeConfig } from '../../interfaces';
import BaseType from './base-type';

export type NestedTypes = { [field: string]: BaseType };

export default class GroupType {
    readonly field: string;
    readonly types: NestedTypes;
    readonly config: FieldTypeConfig;

    constructor(field: string, config: FieldTypeConfig, types: NestedTypes) {
        if (!field || !ts.isString(field)) {
            throw new ts.TSError('A field must be provided and must be of type string');
        }
        this.field = field;
        this.config = config;
        this.types = types;
    }

    toESMapping(_version?: number): TypeESMapping {
        return {} as any;
    }

    toGraphQL(): GraphQLType {
        return { type: 'test' };
    }

    toXlucene(): TypeConfig {
        const configs = Object.values(this.types).map((type) => type.toXlucene());
        return Object.assign({}, ...configs);
    }
}
