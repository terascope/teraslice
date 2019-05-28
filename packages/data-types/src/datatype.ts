
import { DataTypeManager, DataTypeConfig, EsMapSettings, MappingConfiguration } from './interfaces';
import BaseType from './types/versions/base-type';
import * as ts from '@terascope/utils';
import { TypesManager } from './types';

export class DataType implements DataTypeManager {
    private _name!: string;
    private _types: BaseType[];

    static mergeGraphQLDataTypes(types: DataType[], typeInjection?:string) {
        const customTypesList: string[] = [];
        const baseTypeList: string[] = [];

        types.forEach((type) => {
            const { baseType, customTypes } = type.toGraphQLTypes(null, typeInjection);
            customTypesList.push(...customTypes);
            baseTypeList.push(baseType);
        });

        return `
            ${baseTypeList.join('\n')}
            ${[...new Set(customTypesList)].join('\n')}
        `;
    }

    constructor({ version, fields:typesConfig }: DataTypeConfig, typeName?: string) {
        if (version == null) throw new ts.TSError('No version was specified in type_config');
        const typeManager = new TypesManager(version);
        const types:BaseType[] = [];
        for (const key in typesConfig) {
            // ignore metadata settings
            if (key.charAt(0) !== '$') {
                const typeConfig = typesConfig[key];
                types.push(typeManager.getType(key, typeConfig));
            }
        }
        if (typeName != null) this._name = typeName;
        this._types = types;
    }

    toESMapping({ typeName, settings: settingsConfig, mappingMetaData }: MappingConfiguration) {
        const argAnalyzer = ts.get(settingsConfig || {}, ['analysis', 'analyzer'], {});
        const argTokenizer = ts.get(settingsConfig || {}, ['analysis', 'tokenizer'], {});

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
                tokenizer
            }
        };

        // TODO: what default settings and analyzers should go here?
        const settings: EsMapSettings = {
            ...settingsConfig,
            ...analysis
        };

        const mappingConfig = {
            properties
        };

        if (mappingMetaData != null && ts.isPlainObject(mappingMetaData)) {
            for (const key in mappingMetaData) {
                mappingConfig[key] = mappingMetaData[key];
            }
        }

        return {
            mappings: {
                [typeName]: mappingConfig
            },
            settings
        };
    }

    toGraphQl(typeName?: string|null|undefined, typeInjection?:string) {
        const { baseType, customTypes } = this.toGraphQLTypes(typeName, typeInjection);

        return  `
            ${baseType}
            ${[...new Set(customTypes)].join('\n')}
        `;
    }

    toGraphQLTypes(typeName?: string|null|undefined, typeInjection?:string) {
        const name = typeName || this._name;
        if (name == null) throw new ts.TSError('No name was specified to create the graphql type representing this data structure');
        const customTypes: string[] = [];
        const baseCollection: string[] = [];

        if (typeInjection) baseCollection.push(typeInjection);

        this._types.forEach((typeClass) => {
            const { type, custom_type: customType } = typeClass.toGraphQl();
            baseCollection.push(type);
            if (customType != null) customTypes.push(customType);
        });

        const baseType = `
            type ${name} {
                ${baseCollection.join('\n')}
            }
        `;

        const results = `
            ${baseType}
            ${[...new Set(customTypes)].join('\n')}
        `;

        return  {
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
