import * as ts from '@terascope/utils';
import { formatSchema } from './graphql-helper';
import { DataTypeConfig, ESMappingOptions, GraphQLArgs, ESMapping } from './interfaces';
import BaseType from './types/versions/base-type';
import { TypesManager } from './types';

export class DataType {
    private _name!: string;
    private _types: BaseType[];

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

    constructor({ version, fields: typesConfiguration }: DataTypeConfig, typeName?: string) {
        if (version == null) throw new ts.TSError('No version was specified in type config');
        const typeManager = new TypesManager(version);
        const types: BaseType[] = [];

        for (const key in typesConfiguration) {
            const typeDef = typesConfiguration[key];
            types.push(typeManager.getType(key, typeDef));
        }

        if (typeName != null) this._name = typeName;
        this._types = types;
    }

    toESMapping({ typeName = this._name, settings, mappingMetaData }: ESMappingOptions): ESMapping {
        const argAnalyzer = ts.get(settings || {}, ['analysis', 'analyzer'], {});
        const argTokenizer = ts.get(settings || {}, ['analysis', 'tokenizer'], {});

        const analyzer = { ...argAnalyzer };
        const tokenizer = { ...argTokenizer };

        const properties = this._types.reduce((accum, type) => {
            const { mapping, analyzer: typeAnalyzer = {}, tokenizer: typeTokenizer = {} } = type.toESMapping();

            // get mapping configuration
            for (const key in mapping) {
                accum[key] = mapping[key];
            }

            // get analyzer configuration
            for (const key in typeAnalyzer) {
                analyzer[key] = typeAnalyzer[key];
            }

            // get tokenizer configuration
            for (const key in typeTokenizer) {
                tokenizer[key] = typeTokenizer[key];
            }

            return accum;
        }, {});

        const analysis = {
            analysis: {
                analyzer,
                tokenizer,
            },
        };

        const esMapping: ESMapping = {
            settings: {
                ...settings,
                ...analysis,
            },
            mappings: {
                [typeName]: {
                    properties,
                    ...mappingMetaData,
                },
            },
        };

        return esMapping;
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
        if (!typeName) throw new ts.TSError('No typeName was specified to create the graphql type representing this data structure');
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
