
import { DataTypeManager, DataTypeConfig } from './interfaces';
import BaseType from './types/versions/base-type';
import * as ts from '@terascope/utils';

// @ts-ignore
import { TypesManager } from './types';

export class DataTypes implements DataTypeManager {
    // @ts-ignore
    private types: Type[];
    // TODO: need name of data type?
    constructor({ version, fields:typesConfig }: DataTypeConfig) {
        if (version == null) throw new ts.TSError('No $version was specified in type_config');
        const typeManager = new TypesManager(version);
        const types:BaseType[] = [];
        for (const key in typesConfig) {
            // ignore metadata settings
            if (key.charAt(0) !== '$') {
                const typeConfig = typesConfig[key];
                types.push(typeManager.getType(key, typeConfig));
            }
        }
        this.types = types;
    }

    toESMapping() {
        return {};
    }

    toGraphQl() {
        return {};
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
