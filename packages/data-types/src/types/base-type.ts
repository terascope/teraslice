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

/** Options controlling how a field is rendered into GraphQL. */
export type ToGraphQLOptions = {
    typeName?: string;
    isInput?: boolean;
    includePrivate?: boolean;
    useSnakeCase?: boolean;
};

/**
 * The abstract base class every field type extends. It captures a single
 * field's identity (`field` name, its `DataTypeFieldConfig`, and the data-type
 * `version`) and defines the contract for converting that field into each
 * supported output format.
 *
 * Concrete subclasses implement the three conversion methods; `BaseType`
 * itself provides the shared validation and GraphQL-formatting helpers they
 * build on. Subclasses live in `types/v1/` (the versioned field types) plus the
 * grouping types {@link GroupType} and {@link TupleType} in `types/`.
 */
export default abstract class BaseType {
    readonly field: string;
    readonly config: DataTypeFieldConfig;
    readonly version: number;

    constructor(field: string, config: DataTypeFieldConfig, version = 1) {
        this.version = version;
        this.field = field;
        this.config = config;
    }

    /**
     * Guard used by subclasses before emitting an ES mapping: throws if the
     * field is configured `indexed: false` but its type is in
     * `indexedRequiredFieldTypes` (types that cannot be left unindexed).
     */
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

    /**
     * Build the `{ type, customTypes }` GraphQL result for a field of the given
     * GraphQL `type`. Honors the field's `description` and `array` config
     * (wrapping the type as a `[list]`), and carries along any `customType`
     * SDL definitions (e.g. `scalar`/nested-type declarations) the field needs.
     */
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

    /**
     * Build the generated name for a custom GraphQL type, e.g.
     * `DT<TypeName>V<version>` (with an `Input` suffix for input types). Used by
     * the grouping types to name the nested types they emit.
     */
    _formatGQLTypeName(typeName: string, isInput?: boolean, inputSuffix = 'Input'): string {
        return [
            'DT',
            typeName,
            isInput ? inputSuffix : '',
            `V${this.version}`
        ].join('');
    }
}

/** Normalize the optional custom-type argument into an array. */
function makeCustomTypes(customType?: string|(string[])): string[] {
    if (!customType?.length) return [];
    return castArray(customType);
}

/** Prefix a GraphQL type/field line with its formatted description, when present. */
export function formatGQLType(type: string, desc?: string): string {
    if (!desc) return type;
    return `${formatGQLDescription(desc)}\n${type}`;
}
