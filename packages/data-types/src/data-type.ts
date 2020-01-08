import * as ts from '@terascope/utils';
import defaultsDeep from 'lodash.defaultsdeep';
import { formatSchema } from './graphql-helper';
import * as i from './interfaces';
import BaseType from './types/versions/base-type';
import * as utils from './utils';
import { TypesManager } from './types';

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
    readonly config: i.DataTypeConfig;

    private readonly _types: BaseType[];

    /** Merge multiple data types into one GraphQL schema, useful for removing duplicates */
    static mergeGraphQLDataTypes(types: DataType[], options: i.MergeGraphQLOptions = {}) {
        const {
            references: typeReferences = {},
            removeScalars = false
        } = options;

        const customTypesList: string[] = [];
        const baseTypeList: string[] = [];
        const names: string[] = [];

        types.forEach((type) => {
            if (!type.name || !ts.isString(type.name)) {
                throw new Error('Unable to process DataType with missing type name');
            }

            if (names.includes(type.name)) {
                throw new Error(`Unable to process duplicate DataType "${type.name}"`);
            }

            names.push(type.name);

            const global = typeReferences.__all || [];
            const typeSpecific = typeReferences[type.name] || [];
            const references: string[] = utils.concatUniqueStrings(
                global,
                typeSpecific
            );

            const { baseType, customTypes } = type.toGraphQLTypes({
                references,
            });

            customTypesList.push(...customTypes);
            baseTypeList.push(baseType);
        });

        const strSchema = utils.joinStrings(customTypesList, baseTypeList);

        return formatSchema(strSchema, removeScalars);
    }

    constructor(config: i.DataTypeConfig, typeName?: string, description?: string) {
        if (typeName) this.name = typeName;
        if (description) this.description = description;

        const { version, fields } = utils.validateDataTypeConfig(config);
        this.config = Object.freeze({ version, fields });

        const typeManager = new TypesManager(version);
        this._types = typeManager.getTypes(fields);
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

        return defaultsDeep(ts.cloneDeep(overrides), esMapping);
    }

    toGraphQL(args?: i.GraphQLOptions, removeScalars = false) {
        const { schema } = this.toGraphQLTypes(args);

        return formatSchema(schema, removeScalars);
    }

    toGraphQLTypes(args: i.GraphQLOptions = {}): i.GraphQLTypesResult {
        const { typeName = this.name, references = [], description = this.description } = args;
        if (!typeName) {
            throw new ts.TSError('No typeName was specified to create the graphql type representing this data structure');
        }

        const customTypes: string[] = [];
        const baseProperties: string[] = [];

        this._types.forEach((typeClass) => {
            const { type, custom_type: customType } = typeClass.toGraphQL();
            const desc = typeClass.config.description;
            if (desc) {
                baseProperties.push(
                    `${utils.formatGQLComment(desc)}\n${type}`
                );
            } else {
                baseProperties.push(type);
            }
            if (customType) {
                customTypes.push(customType);
            }
        });

        if (references.length) {
            baseProperties.push(utils.formatGQLComment('references and virtual fields'));
            references.forEach((prop) => {
                baseProperties.push(prop);
            });
        }

        const baseType = `
            ${utils.formatGQLComment(description)}
            type ${typeName} {
                ${utils.joinStrings(baseProperties)}
            }
        `.trim();

        const schema = `
            ${baseType}
            ${utils.joinStrings(customTypes)}
        `.trim();

        return {
            schema,
            baseType,
            customTypes,
        };
    }

    toXlucene() {
        return this._types.reduce((accum, type) => ({ ...accum, ...type.toXlucene() }), {});
    }
}
