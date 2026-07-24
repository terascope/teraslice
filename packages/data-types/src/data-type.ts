import {
    isString, set, startsWith,
    defaultsDeep
} from '@terascope/core-utils';
import {
    DataTypeConfig, ElasticsearchDistribution, ESMapping,
    ESTypeMappings, ReadonlyDataTypeFields, xLuceneTypeConfig
} from '@terascope/types';
import { formatSchema, formatGQLDescription } from './graphql-helper.js';
import * as i from './interfaces.js';
import BaseType from './types/base-type.js';
import * as utils from './utils.js';
import { getTypes, LATEST_VERSION, getGroupedFields } from './types/index.js';

/**
 * A DataType is used to define the structure of data with version support
 * and can be converted to the following formats:
 *
 * - Elasticsearch Mappings
 * - GraphQL Schemas
 * - xLucene
 *
 * It is constructed from a `DataTypeConfig` (a `version` plus a map of field
 * names to their {@link BaseType} configs); nested `Object` and `Tuple` fields
 * declared with dot-notation are grouped into {@link GroupType} /
 * {@link TupleType} instances during construction.
 *
 * @example
 * const dataType = new DataType({
 *     version: 1,
 *     fields: {
 *         name: { type: 'Keyword' },
 *         location: { type: 'GeoPoint' },
 *     },
 * }, 'Person');
 *
 * dataType.toESMapping();  // Elasticsearch/OpenSearch mapping
 * dataType.toGraphQL();    // GraphQL schema string
 * dataType.toXlucene();    // xLucene type config
 */
export class DataType {
    readonly name!: string;
    readonly description?: string;
    readonly fields: ReadonlyDataTypeFields;
    readonly version: number;
    /** An object of base fields with their child fields */
    readonly groupedFields: i.GroupedFields;

    private readonly _types: BaseType[];

    /**
     * Merge multiple data types into a single GraphQL schema, de-duplicating
     * shared custom types and scalars. Throws on a missing or duplicate type
     * name (or duplicate input name when `createInputTypes` is set). Options
     * control input-type generation, snake_case naming, scalar removal, and
     * per-type reference/virtual fields.
     */
    static mergeGraphQLDataTypes(types: DataType[], options: i.MergeGraphQLOptions = {}): string {
        const {
            references: typeReferences = {},
            removeScalars = false,
            useSnakeCase = false
        } = options;

        const customTypes: string[] = [...(options.customTypes ?? [])];
        const typeDefs: string[] = [];
        const names: string[] = [];

        types.forEach((type) => {
            if (!type.name || !isString(type.name)) {
                throw new Error('Unable to process DataType with missing type name');
            }

            if (names.includes(type.name)) {
                throw new Error(`Unable to process duplicate DataType "${type.name}"`);
            }
            names.push(type.name);

            if (options.createInputTypes) {
                const inputName = useSnakeCase ? `${type.name}_input` : `${type.name}Input`;

                if (names.includes(inputName)) {
                    throw new Error(`Unable to process duplicate DataType "${inputName}" input`);
                }
                names.push(inputName);
            }

            const global = typeReferences.__all || [];
            const typeSpecific = typeReferences[type.name] || [];
            const references: string[] = utils.concatUniqueStrings(
                global,
                typeSpecific
            );

            const result = type.toGraphQLTypes({
                references,
                useSnakeCase,
                createInputType: options.createInputTypes,
                includeAllInputFields: options.includeAllInputFields,
            });

            customTypes.push(...result.customTypes);
            typeDefs.push(result.baseType);

            if (result.inputType) {
                typeDefs.push(result.inputType);
            }
        });

        const strSchema = utils.joinStrings(customTypes, customTypes, typeDefs);

        return formatSchema(strSchema, removeScalars);
    }

    /**
     * @param config the data type config; `version` defaults to the latest and
     * `fields` to `{}`, and the config is validated (throwing on an unknown
     * version or invalid field config).
     * @param typeName optional name for the type (required by some conversions,
     * e.g. GraphQL).
     * @param description optional description carried into the GraphQL output.
     */
    constructor(config: Partial<DataTypeConfig>, typeName?: string, description?: string) {
        if (typeName) this.name = typeName;
        if (description) this.description = description;

        const { version, fields } = utils.validateDataTypeConfig({
            version: LATEST_VERSION,
            fields: {},
            ...config,
        });
        this.fields = fields;
        this.version = version!;

        this.groupedFields = getGroupedFields(fields);
        this._types = getTypes(fields, this.groupedFields, version);
    }

    /**
     * Convert the DataType to an elasticsearch mapping.
     */
    toESMapping({
        overrides, distribution = ElasticsearchDistribution.opensearch,
        majorVersion = 2, minorVersion = 15, version = '2.15.0', _meta
    }: Partial<i.ESMappingOptions> = {}): ESMapping {
        const mappings: ESTypeMappings = {
            dynamic: false,
            properties: {},
            ..._meta && { _meta }
        };

        const esMapping: ESMapping = {
            settings: {},
            mappings
        };

        for (const type of this._types) {
            const {
                mapping, analyzer, tokenizer, settings
            } = type.toESMapping({
                distribution, majorVersion, minorVersion, version
            });

            if (mapping) {
                for (const [key, config] of Object.entries(mapping)) {
                    const keyPath = ['mappings', 'properties', key];
                    set(esMapping, keyPath, config);
                }
            }
            if (analyzer) {
                for (const [key, config] of Object.entries(analyzer)) {
                    set(esMapping, ['settings', 'analysis', 'analyzer', key], config);
                }
            }
            if (tokenizer) {
                for (const [key, config] of Object.entries(tokenizer)) {
                    set(esMapping, ['settings', 'analysis', 'tokenizer', key], config);
                }
            }
            if (settings) {
                for (const [key, config] of Object.entries(settings)) {
                    set(esMapping, ['settings', key], config);
                }
            }
        }

        return defaultsDeep({}, overrides, esMapping);
    }

    /**
     * Convert the DataType to a formatted GraphQL schema string. Combines the
     * generated custom types, the base type, an optional input type, and any
     * `args.customTypes`, then validates and prints the result. Pass
     * `removeScalars` to strip `scalar` declarations from the output.
     *
     * Note: fields that reference an undeclared scalar (e.g. `Any`/`Tuple` →
     * `JSON`) require that scalar to be supplied for the schema to validate.
     */
    toGraphQL(args?: i.GraphQLOptions, removeScalars = false): string {
        const { baseType, inputType, customTypes } = this.toGraphQLTypes(args);
        const schema = utils.joinStrings(
            customTypes, baseType, inputType, args?.customTypes
        );
        return formatSchema(schema, removeScalars);
    }

    /**
     * Build the GraphQL type parts without assembling/validating a full schema:
     * the `baseType` definition, an optional `inputType`, and the `customTypes`
     * (scalars and generated nested types) the fields reference. Use this when
     * composing several data types into one schema (see
     * {@link DataType.mergeGraphQLDataTypes}); use `toGraphQL` for a single,
     * ready-to-use schema string. Throws if no type name is available.
     */
    toGraphQLTypes(args: i.GraphQLOptions = {}): i.GraphQLTypesResult {
        const {
            typeName = this.name,
            references = [],
            useSnakeCase = false,
            description = this.description,
            createInputType = false
        } = args;

        if (!typeName) {
            throw new Error('No typeName was specified to create the graphql type representing this data structure');
        }

        const inputName = useSnakeCase ? `${typeName}_input` : `${typeName}Input`;

        const customTypes: string[] = [];
        const baseProperties: string[] = [];
        const inputProperties: string[] = [];

        this._types.forEach((typeClass) => {
            const result = typeClass.toGraphQL({
                typeName,
                useSnakeCase,
            });
            baseProperties.push(result.type);
            customTypes.push(...result.customTypes);

            if (createInputType) {
                if (args.includeAllInputFields
                    || !startsWith(typeClass.field, '_')) {
                    const inputResult = typeClass.toGraphQL({
                        typeName,
                        isInput: true,
                        useSnakeCase,
                        includePrivate: args.includeAllInputFields
                    });
                    inputProperties.push(inputResult.type);
                    customTypes.push(...inputResult.customTypes);
                }
            }
        });

        if (references.length) {
            baseProperties.push(utils.joinStrings(
                formatGQLDescription('references and virtual fields'),
                references
            ));
        }

        const baseType = utils.joinStrings(
            formatGQLDescription(description),
            `type ${typeName} {
                ${utils.joinStrings(baseProperties)}
            }`
        );

        let inputType: string | undefined;

        if (createInputType) {
            inputType = utils.joinStrings(
                formatGQLDescription(description, `Input for ${typeName}`),
                `input ${inputName} {
                    ${utils.joinStrings(inputProperties)}
                }`
            );
        }

        return {
            baseType,
            inputType,
            customTypes,
        };
    }

    /**
     * Convert the DataType to an xLucene type config — a flat map of field name
     * (including nested dot-notation paths) to its xLucene field type, merged
     * across every field.
     */
    toXlucene(): xLuceneTypeConfig {
        return this._types.reduce((accum, type) => ({ ...accum, ...type.toXlucene() }), {});
    }
}
