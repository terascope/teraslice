import { TypeConfig } from 'xlucene-evaluator';
import * as ts from '@terascope/utils';
import {
    GraphQLType, TypeESMapping, FieldTypeConfig
} from '../../interfaces';
import { formatGQLComment } from '../../graphql-helper';

// eslint-disable-next-line @typescript-eslint/interface-name-prefix
export interface IBaseType {
    new(field: string, config: FieldTypeConfig): BaseType;
}

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
    abstract toGraphQL(typeName?: string, isInput?: boolean, includePrivate?: boolean): GraphQLType;
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

    _formatGQLTypeName(
        typeName: string,
        isInput?: boolean,
        includeField?: boolean,
        version?: number
    ): string {
        return [
            'DT',
            (typeName),
            includeField ? ts.firstToUpper(this.field) : '',
            isInput ? 'Input' : '',
            `V${version ?? 1}`
        ].filter(Boolean).join('');
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
