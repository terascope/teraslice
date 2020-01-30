import * as ts from '@terascope/utils';
import defaultsDeep from 'lodash.defaultsdeep';
import { formatSchema, formatGQLComment } from './graphql-helper';
import * as i from './interfaces';
import BaseType from './types/base-type';
import * as utils from './utils';
import { getTypes, LATEST_VERSION, getGroupedFields } from './types';

/**
 * A DataType is used to define the structure of data with version support
 * and can be converted to the following formats:
 *
 * - Elasticsearch Mappings
 * - GraphQL Schemas
 * - xLucene
 */
export class DataType {
    readonly name!: string;
    readonly description?: string;
    readonly fields: i.TypeConfigFields;
    readonly version: i.AvailableVersion;
    /** An object of base fields with their child fields */
    readonly groupedFields: i.GroupedFields;

    private readonly _types: BaseType[];

    /** Merge multiple data types into one GraphQL schema, useful for removing duplicates */
    static mergeGraphQLDataTypes(types: DataType[], options: i.MergeGraphQLOptions = {}) {
        const {
            references: typeReferences = {},
            removeScalars = false,
            useSnakeCase = false
        } = options;

        const customTypes: string[] = [...(options.customTypes ?? [])];
        const typeDefs: string[] = [];
        const names: string[] = [];

        types.forEach((type) => {
            if (!type.name || !ts.isString(type.name)) {
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

    constructor(config: Partial<i.DataTypeConfig>, typeName?: string, description?: string) {
        if (typeName) this.name = typeName;
        if (description) this.description = description;

        const { version, fields } = utils.validateDataTypeConfig({
            version: LATEST_VERSION,
            fields: {},
            ...config,
        });
        this.fields = fields;
        this.version = version;

        this.groupedFields = getGroupedFields(fields);
        this._types = getTypes(fields, this.groupedFields, version);
    }

    /**
     * Convert the DataType to an elasticsearch mapping.
     */
    toESMapping({ typeName, overrides, version = 6 }: i.ESMappingOptions = {}): i.ESMapping {
        const indexType = typeName || this.name || '_doc';
        const mappingSettings = {
            dynamic: false,
            properties: {},
        };

        if (version < 7) {
            Object.assign(mappingSettings, {
                _all: {
                    enabled: false,
                },
            });
        }

        const esMapping: i.ESMapping = {
            settings: {},
            mappings: {
                [indexType]: mappingSettings,
            },
        };

        for (const type of this._types) {
            const { mapping, analyzer, tokenizer } = type.toESMapping(version);
            if (mapping) {
                for (const [key, config] of Object.entries(mapping)) {
                    ts.set(esMapping, ['mappings', indexType, 'properties', key], config);
                }
            }
            if (analyzer) {
                for (const [key, config] of Object.entries(analyzer)) {
                    ts.set(esMapping, ['settings', 'analysis', 'analyzer', key], config);
                }
            }
            if (tokenizer) {
                for (const [key, config] of Object.entries(tokenizer)) {
                    ts.set(esMapping, ['settings', 'analysis', 'tokenizer', key], config);
                }
            }
        }

        return defaultsDeep({}, overrides, esMapping);
    }

    toGraphQL(args?: i.GraphQLOptions, removeScalars = false) {
        const { baseType, inputType, customTypes } = this.toGraphQLTypes(args);
        const schema = utils.joinStrings(
            customTypes, baseType, inputType, args?.customTypes
        );
        return formatSchema(schema, removeScalars);
    }

    toGraphQLTypes(args: i.GraphQLOptions = {}): i.GraphQLTypesResult {
        const {
            typeName = this.name,
            references = [],
            useSnakeCase = false,
            description = this.description,
            createInputType = false
        } = args;

        if (!typeName) {
            throw new ts.TSError('No typeName was specified to create the graphql type representing this data structure');
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
                    || !ts.startsWith(typeClass.field, '_')) {
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
                formatGQLComment('references and virtual fields'),
                references
            ));
        }

        const baseType = utils.joinStrings(
            formatGQLComment(description),
            `type ${typeName} {
                ${utils.joinStrings(baseProperties)}
            }`
        );

        let inputType: string|undefined;

        if (createInputType) {
            inputType = utils.joinStrings(
                formatGQLComment(description, `Input for ${typeName}`),
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

    toXlucene() {
        return this._types.reduce((accum, type) => ({ ...accum, ...type.toXlucene() }), {});
    }
}
