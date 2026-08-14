import {
    xLuceneTypeConfig, PropertyESTypeMapping, PropertyESTypes,
    ClientMetadata,
} from '@terascope/types';
import { firstToUpper } from '@terascope/core-utils';
import BaseType, { ToGraphQLOptions, quoteDuckDBIdentifier } from './base-type.js';
import { GraphQLType, TypeESMapping, DuckDBTypeConfig } from '../interfaces.js';

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
 * - **DuckDB:** ONE entry holding a nested `STRUCT`, since DuckDB nests rather than
 *   flattening. Unlike the conversions above it recurses past one level - see
 *   {@link GroupType.toDuckDB} for why that asymmetry exists.
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

    /**
     * Emit the parent as a single `STRUCT(child TYPE, ...)` entry built from its children.
     *
     * Note this does NOT flatten the way `toXlucene` does: DuckDB nests, so children are not
     * columns of their own and the result has exactly one key. A childless Object stays
     * `JSON` - its shape is unknowable.
     *
     * **This recurses where the rest of the package does not.** `getGroupedFields` splits on
     * the FIRST dot only (`getTypes` carries a `@todo support multiple levels deep nesting`),
     * so `this.types` is flat: `a.b` and `a.b.c` are siblings here. Inheriting that would
     * emit `STRUCT(b JSON, "b.c" VARCHAR)` - a struct with a dotted member name, which is a
     * broken table definition rather than merely an incomplete one. So the dotted paths are
     * regrouped and nested properly.
     */
    toDuckDB(): DuckDBTypeConfig {
        const children: [name: string, type: BaseType][] = [];

        for (const [field, type] of Object.entries(this.types)) {
            if (field === this.field) continue;
            children.push([this._removeBase(field), type]);
        }

        if (!children.length) return this._formatDuckDB('JSON');
        return this._formatDuckDB(buildStruct(children));
    }

    private _removeBase(str: string) {
        return str.replace(`${this.field}.`, '').trim();
    }
}

/**
 * Build a `STRUCT(...)` from dot-notation paths, nesting each level.
 *
 * `[['a', T], ['b.c', U]]` becomes `STRUCT(a <T>, b STRUCT(c <U>))`. An intermediate level
 * that also has its own entry (`b` alongside `b.c`) is superseded by the struct built from
 * its descendants, since a STRUCT member cannot be both a scalar and a group.
 */
function buildStruct(children: [name: string, type: BaseType][]): string {
    const direct = new Map<string, BaseType>();
    const nested = new Map<string, [string, BaseType][]>();

    for (const [name, type] of children) {
        const dot = name.indexOf('.');
        if (dot === -1) {
            direct.set(name, type);
            continue;
        }
        const head = name.slice(0, dot);
        const rest = name.slice(dot + 1);
        const group = nested.get(head) ?? [];
        group.push([rest, type]);
        nested.set(head, group);
    }

    const members: string[] = [];

    for (const [name, type] of direct) {
        if (nested.has(name)) continue; // the group wins over the bare parent entry
        members.push(`${quoteDuckDBIdentifier(name)} ${type.toDuckDB()[type.field]}`);
    }

    for (const [name, group] of nested) {
        members.push(`${quoteDuckDBIdentifier(name)} ${buildStruct(group)}`);
    }

    return `STRUCT(${members.join(', ')})`;
}
