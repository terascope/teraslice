
import { DataTypeManager, DataTypeConfig } from './interfaces';
import BaseType from './types/versions/base-type';
import * as ts from '@terascope/utils';

// @ts-ignore
import { TypesManager } from './types';

export class DataTypes implements DataTypeManager {
    private name!: string;
    // @ts-ignore
    private types: Type[];
    // TODO: need name of data type?
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

    toESMapping() {
        return {};
    }

    toGraphQl(typeName?: string) {
        const name = typeName || this.name;
        if (name == null) throw new ts.TSError('No name was specified to create the graphql type representing this data structure');
        const customTypes: string[] = [];
        const baseCollection: string[] = [];

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
