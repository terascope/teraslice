
import { DataTypeManager, DataTypeConfig, EsMapSettings } from './interfaces';
import BaseType from './types/versions/base-type';
import * as ts from '@terascope/utils';

// @ts-ignore
import { TypesManager } from './types';

export class DataType implements DataTypeManager {
    private name!: string;
    private types: BaseType[];

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
        if (typeName != null) this.name = typeName;
        this.types = types;
    }

    toESMapping(mappingType:string, settingsConfig?: EsMapSettings) {
        if (mappingType == null) throw new ts.TSError('A type must be specified for this index');
        const argAnalyzer = ts.get(settingsConfig || {}, ['analysis', 'analyzer'], {});
        const analyzer = { ...argAnalyzer };
        const properties = this.types.reduce((accum, type) => {
            const { mapping, analyzer: typeAnalyzer = {} } = type.toESMapping();

            // get mapping configuration
            for (const key in mapping) {
                accum[key] = mapping[key];
            }

            // get analyzer configuration
            for (const key in typeAnalyzer) {
                analyzer[key] = typeAnalyzer[key];
            }

            return accum;
        }, {});

        const analysis = {
            analysis: {
                analyzer
            }
        };

        // TODO: what default settings and analyzers should go here?
        const settings: EsMapSettings = {
            ...settingsConfig,
            ...analysis
        };

        return {
            mappings: {
                [mappingType]: {
                    properties
                }
            },
            settings
        };
    }

    toGraphQl(typeName?: string|null|undefined, typeInjection?:string) {
        const name = typeName || this.name;
        if (name == null) throw new ts.TSError('No name was specified to create the graphql type representing this data structure');
        const customTypes: string[] = [];
        const baseCollection: string[] = [];

        if (typeInjection) baseCollection.push(typeInjection);

        this.types.forEach((typeClass) => {
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
        return this.types.reduce((accum, type) => {
            const xluceneType = type.toXlucene();
            for (const key in xluceneType) {
                accum[key] = xluceneType[key];
            }
            return accum;
        }, {});
    }
}
