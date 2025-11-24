import {
    ClientMetadata, DataTypeFieldConfig, xLuceneTypeConfig,
    indexedRequiredFieldTypes
} from '@terascope/types';
import { castArray } from '@terascope/core-utils';
import { GraphQLType, TypeESMapping } from '../interfaces.js';
import { formatGQLDescription } from '../graphql-helper.js';

export interface IBaseType {
    new(field: string, config: DataTypeFieldConfig): BaseType;
}

export type ToGraphQLOptions = {
    typeName?: string;
    isInput?: boolean;
    includePrivate?: boolean;
    useSnakeCase?: boolean;
};

export default abstract class BaseType {
    readonly field: string;
    readonly config: DataTypeFieldConfig;
    readonly version: number;

    constructor(field: string, config: DataTypeFieldConfig, version = 1) {
        this.version = version;
        this.field = field;
        this.config = config;
    }

    protected _validateESMapping() {
        if (this.config.indexed === false) {
            if (this.config.type in indexedRequiredFieldTypes) {
                throw new Error(`${this.config.type} is required to be indexed`);
            }
        }
    }
    abstract toESMapping(config: ClientMetadata): TypeESMapping;
    abstract toGraphQL(options?: ToGraphQLOptions): GraphQLType;
    abstract toXlucene(): xLuceneTypeConfig;

    protected _formatGql(
        type: string,
        customType?: string|(string[])
    ): GraphQLType {
        const desc = this.config.description;
        if (this.config.array) {
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
    return castArray(customType);
}

export function formatGQLType(type: string, desc?: string): string {
    if (!desc) return type;
    return `${formatGQLDescription(desc)}\n${type}`;
}
