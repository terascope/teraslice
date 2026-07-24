import {
    xLuceneTypeConfig, PropertyESTypeMapping, PropertyESTypes,
    ClientMetadata,
} from '@terascope/types';
import { firstToUpper } from '@terascope/core-utils';
import BaseType, { ToGraphQLOptions } from './base-type.js';
import { GraphQLType, TypeESMapping } from '../interfaces.js';

export type NestedTypes = { [field: string]: BaseType };

/**
 * Represents an `Object` field together with its nested children as a single
 * grouped unit. This is not a `FieldType` you declare directly — it is
 * assembled during field grouping (`getGroupType`) from an `Object` parent and
 * its dot-notation children (e.g. `user` + `user.id` + `user.name`), so the
 * parent and its descendants convert together into one nested structure.
 *
 * - **ES/OpenSearch mapping:** the parent's `object`/`nested` mapping with each
 *   child folded into its `properties` (recursively, since a child may itself
 *   be a group), merging any analyzers/tokenizers the children contribute.
 * - **GraphQL:** a generated nested type (`DT<Parent><Field>V<version>`) whose
 *   fields are the children, referenced from the parent type.
 * - **xLucene:** the merged xLucene configs of the parent and all children,
 *   keyed by their full dot-notation paths.
 *
 * @see {@link TupleType} for the ordered-set analogue.
 */
export default class GroupType extends BaseType {
    readonly types: NestedTypes;

    constructor(field: string, version: number, types: NestedTypes) {
        super(field, types[field].config, version);
        this.types = types;
    }

    /**
     * Emit the parent's mapping with each child nested under its `properties`,
     * accumulating any analyzers/tokenizers contributed by the children.
     */
    toESMapping(config: ClientMetadata): TypeESMapping {
        const {
            mapping,
            analyzer = {},
            tokenizer = {},
        } = this.types[this.field].toESMapping(config);
        const baseMapping = mapping[this.field] as PropertyESTypeMapping;
        if (!baseMapping.properties) {
            baseMapping.properties = {};
        }

        for (const [field, type] of Object.entries(this.types)) {
            if (field === this.field) {
                continue;
            }

            const fieldResult = type.toESMapping(config);

            const nestedField = this._removeBase(field);
            const fieldMapping = fieldResult.mapping[field] as PropertyESTypes;
            baseMapping.properties[nestedField] = fieldMapping;

            Object.assign(tokenizer, fieldResult.tokenizer);
            Object.assign(analyzer, fieldResult.analyzer);
        }

        return {
            mapping,
            analyzer,
            tokenizer,
        };
    }

    /**
     * Emit a generated nested GraphQL type built from the children and return
     * the parent field referencing it (as `[list]` when the parent is an array).
     */
    toGraphQL(options: ToGraphQLOptions = {}): GraphQLType {
        const { typeName = 'Object', isInput, includePrivate } = options;

        const customTypeName = this._formatGQLTypeName(
            options.useSnakeCase
                ? `_${typeName}_${this.field}_`
                : `${typeName}${firstToUpper(this.field)}`,
            options.isInput,
            options.useSnakeCase ? 'input_' : undefined
        );

        const properties: string[] = [];
        const customTypes: string[] = [];

        for (const [field, type] of Object.entries(this.types)) {
            if (field === this.field) {
                continue;
            }

            if (isInput && includePrivate && this._removeBase(field).startsWith('_')) {
                continue;
            }

            const result = type.toGraphQL(options);

            properties.push(this._removeBase(result.type));

            customTypes.push(...result.customTypes);
        }

        const props = [...properties].sort();

        const defType = isInput ? 'input' : 'type';
        customTypes.push(`
            ${defType} ${customTypeName} {
                ${props.join('\n')}
            }
        `);

        return this._formatGql(customTypeName, customTypes);
    }

    toXlucene(): xLuceneTypeConfig {
        const configs = Object.values(this.types).map((type) => type.toXlucene());
        return Object.assign({}, ...configs);
    }

    private _removeBase(str: string) {
        return str.replace(`${this.field}.`, '').trim();
    }
}
