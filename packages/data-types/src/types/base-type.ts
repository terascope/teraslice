import { TypeConfig } from 'xlucene-evaluator';
import * as ts from '@terascope/utils';
import {
    GraphQLType, TypeESMapping, FieldTypeConfig
} from '../interfaces';
import { formatGQLComment } from '../graphql-helper';

// eslint-disable-next-line @typescript-eslint/interface-name-prefix
export interface IBaseType {
    new(field: string, config: FieldTypeConfig): BaseType;
}

export type ToGraphQLOptions = {
    typeName?: string;
    isInput?: boolean;
    includePrivate?: boolean;
    useSnakeCase?: boolean;
};

export default abstract class BaseType {
    readonly field: string;
    readonly config: FieldTypeConfig;
    readonly version: number;

    constructor(field: string, config: FieldTypeConfig, version = 1) {
        if (!field || !ts.isString(field)) {
            throw new ts.TSError('A field must be provided and must be of type string');
        }
        this.version = version;
        this.field = field;
        this.config = config;
    }

    abstract toESMapping(version?: number): TypeESMapping;
    abstract toGraphQL(options?: ToGraphQLOptions): GraphQLType;
    abstract toXlucene(): TypeConfig;

    protected _formatGql(
        type: string,
        customType?: string|(string[])
    ): GraphQLType {
        const desc = this.config.description;
        if (type !== 'JSONObject' && this.config.array) {
            return {
                type: formatGQLType(`${this.field}: [${type}]`, desc),
                customTypes: makeCustomTypes(customType),
            };
        }
        return {
            type: formatGQLType(`${this.field}: ${type}`, desc),
            customTypes: makeCustomTypes(customType)
        };
    }

    _formatGQLTypeName(typeName: string, isInput?: boolean, inputSuffix = 'Input'): string {
        return [
            'DT',
            typeName,
            isInput ? inputSuffix : '',
            `V${this.version}`
        ].join('');
    }
}

function makeCustomTypes(customType?: string|(string[])): string[] {
    if (!customType?.length) return [];
    return ts.castArray(customType);
}

export function formatGQLType(type: string, desc?: string) {
    if (!desc) return type;
    return `${formatGQLComment(desc)}\n${type}`;
}
