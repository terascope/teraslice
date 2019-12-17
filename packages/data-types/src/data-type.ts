import * as ts from '@terascope/utils';
import defaultsDeep from 'lodash.defaultsdeep';
import { formatSchema } from './graphql-helper';
import * as i from './interfaces';
import BaseType from './types/versions/base-type';
import { validateDataTypeConfig, formatGQLComment } from './utils';
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

    private readonly _types: BaseType[];

    /** Merge multiple data types into one GraphQL schema, useful for removing duplicates */
    static mergeGraphQLDataTypes(types: DataType[], typeReferences: i.GraphQLTypeReferences = {}) {
        const customTypesList: string[] = [];
        const baseTypeList: string[] = [];

        types.forEach((type) => {
            const global = typeReferences.__all || [];
            const typeSpecific = typeReferences[type.name] || [];
            const references: string[] = [...global, ...typeSpecific];

            const { baseType, customTypes } = type.toGraphQLTypes({
                references,
            });

            customTypesList.push(...customTypes.map(ts.trim));
            baseTypeList.push(baseType.trim());
        });

        const strSchema = `
            ${baseTypeList.join('\n')}
            ${ts.uniq(customTypesList).join('\n')}
        `;

        return formatSchema(strSchema);
    }

    constructor(config: i.DataTypeConfig, typeName?: string, description?: string) {
        if (typeName) this.name = typeName;
        if (description) this.description = description;

        const { version, fields } = validateDataTypeConfig(config);

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

    toGraphQL(args?: i.GraphQLOptions) {
        const { schema } = this.toGraphQLTypes(args);

        return formatSchema(schema);
    }

    toGraphQLTypes(args: i.GraphQLOptions = {}): i.GraphQLTypesResult {
        const { typeName = this.name, references = [], description = this.description } = args;
        if (!typeName) {
            throw new ts.TSError('No typeName was specified to create the graphql type representing this data structure');
        }

        const customTypes = new Set<string>();
        const baseProperties = new Set<string>();

        this._types.forEach((typeClass) => {
            const { type, custom_type: customType } = typeClass.toGraphQL();
            const desc = typeClass.config.description;
            if (desc) {
                baseProperties.add(
                    `${formatGQLComment(desc)}\n${type.trim()}`
                );
            } else {
                baseProperties.add(type.trim());
            }
            if (customType) {
                customTypes.add(customType.trim());
            }
        });

        if (references.length) {
            baseProperties.add(formatGQLComment('references and virtual fields'));
            references.forEach((prop) => {
                baseProperties.add(prop.trim());
            });
        }

        const baseType = `
            ${formatGQLComment(description)}
            type ${typeName} {
                ${[...baseProperties].join('\n')}
            }
        `.trim();

        const schema = `
            ${baseType}
            ${[...customTypes].join('\n')}
        `.trim();

        return {
            schema,
            baseType,
            customTypes: [...customTypes],
        };
    }

    toXlucene() {
        return this._types.reduce((accum, type) => ({ ...accum, ...type.toXlucene() }), {});
    }
}
