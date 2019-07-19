import * as ts from '@terascope/utils';
import set from 'lodash.set';
import defaultsDeep from 'lodash.defaultsdeep';
import { formatSchema } from './graphql-helper';
import * as i from './interfaces';
import BaseType from './types/versions/base-type';
import { validateDataTypeConfig } from './utils';
import { TypesManager } from './types';

/**
 * A DataType is used to define the structure of data with version support
 * and can be converted to the following formats:
 *
 * - Elasticsearch Mappings
 * - GraphQL Schemas
 * - Xlucene
 */
export class DataType {
    name!: string;
    private _types: BaseType[];

    /** Merge multiple data types into one GraphQL schema, useful for removing duplicates */
    static mergeGraphQLDataTypes(types: DataType[], typeReferences: i.GraphQLTypeReferences = {}) {
        const customTypesList: string[] = [];
        const baseTypeList: string[] = [];

        types.forEach(type => {
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

    constructor(config: i.DataTypeConfig, typeName?: string) {
        if (typeName != null) this.name = typeName;
        const { version, fields } = validateDataTypeConfig(config);

        const typeManager = new TypesManager(version);
        this._types = typeManager.getTypes(fields);
    }

    /**
     * Convert the DataType to an elasticsearch mapping.
     */
    toESMapping({ typeName, overrides }: i.ESMappingOptions = {}): i.ESMapping {
        const indexType = typeName || this.name || '_doc';
        const esMapping: i.ESMapping = {
            settings: {},
            mappings: {
                [indexType]: {
                    _all: {
                        enabled: false,
                    },
                    dynamic: false,
                    properties: {},
                },
            },
        };

        for (const type of this._types) {
            const { mapping, analyzer, tokenizer } = type.toESMapping();
            if (mapping) {
                for (const [key, config] of Object.entries(mapping)) {
                    set(esMapping, ['mappings', indexType, 'properties', key], config);
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
        }

        return defaultsDeep(ts.cloneDeep(overrides), esMapping);
    }

    toGraphQL(args?: i.GraphQLOptions) {
        const { schema } = this.toGraphQLTypes(args);

        return formatSchema(schema);
    }

    toGraphQLTypes(args: i.GraphQLOptions = {}): i.GraphQLTypesResult {
        const { typeName = this.name, references = [] } = args;
        if (!typeName) {
            throw new ts.TSError('No typeName was specified to create the graphql type representing this data structure');
        }

        const customTypes = new Set<string>();
        const baseProperties = new Set<string>();

        this._types.forEach(typeClass => {
            const { type, custom_type: customType } = typeClass.toGraphQL();
            baseProperties.add(type.trim());
            if (customType) {
                customTypes.add(customType.trim());
            }
        });

        if (references.length) {
            baseProperties.add('# references and virtual fields');
            references.forEach(prop => {
                baseProperties.add(prop.trim());
            });
        }

        const baseType = `
            type ${typeName} {
                ${[...baseProperties].join('\n')}
            }
        `;

        const schema = `
            ${baseType}
            ${[...customTypes].join('\n')}
        `;

        return {
            schema,
            baseType,
            customTypes: [...customTypes],
        };
    }

    toXlucene() {
        return this._types.reduce((accum, type) => {
            const xluceneType = type.toXlucene();
            for (const key in xluceneType) {
                accum[key] = xluceneType[key];
            }
            return accum;
        }, {});
    }
}
