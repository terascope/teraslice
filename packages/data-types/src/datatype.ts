import * as ts from '@terascope/utils';
import set from 'lodash.set';
import defaultsDeep from 'lodash.defaultsdeep';
import { formatSchema } from './graphql-helper';
import { DataTypeConfig, ESMappingOptions, GraphQLArgs, ESMapping } from './interfaces';
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
    private _name!: string;
    private _types: BaseType[];

    /** Merge multiple data types into one GraphQL schema, useful for removing duplicates */
    static mergeGraphQLDataTypes(types: DataType[], typeInjection?: string) {
        const customTypesList: string[] = [];
        const baseTypeList: string[] = [];

        types.forEach(type => {
            const { baseType, customTypes } = type.toGraphQLTypes({ typeInjection });
            customTypesList.push(...customTypes.map(str => str.trim()));
            baseTypeList.push(baseType.trim());
        });

        const strSchema = `
            ${baseTypeList.join('\n')}
            ${[...new Set(customTypesList)].join('\n')}
        `;

        return formatSchema(strSchema);
    }

    constructor(config: DataTypeConfig, typeName?: string) {
        if (typeName != null) this._name = typeName;
        const { version, fields } = validateDataTypeConfig(config);

        const typeManager = new TypesManager(version);
        this._types = typeManager.getTypes(fields);
    }

    /**
     * Convert the DataType to an elasticsearch mapping.
     */
    toESMapping({ typeName, overrides }: ESMappingOptions = {}): ESMapping {
        const indexType = typeName || this._name || '_doc';
        const esMapping: ESMapping = {
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

    toGraphQL(args?: GraphQLArgs) {
        const { baseType, customTypes } = this.toGraphQLTypes(args);

        return formatSchema(`
            ${baseType}
            ${[...new Set(customTypes)].join('\n')}
        `);
    }

    // typeName = this._name, typeInjection?:string
    toGraphQLTypes(args = {} as GraphQLArgs) {
        const { typeName = this._name, typeInjection } = args;
        if (!typeName) {
            throw new ts.TSError('No typeName was specified to create the graphql type representing this data structure');
        }

        const customTypes: string[] = [];
        const baseCollection: string[] = [];

        if (typeInjection) baseCollection.push(typeInjection);

        this._types.forEach(typeClass => {
            const { type, custom_type: customType } = typeClass.toGraphQL();
            baseCollection.push(type);
            if (customType != null) customTypes.push(customType);
        });

        const baseType = `
            type ${typeName} {
                ${baseCollection.join('\n')}
            }
        `;

        const results = `
            ${baseType}
            ${[...new Set(customTypes)].join('\n')}
        `;

        return {
            results,
            baseType,
            customTypes,
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
