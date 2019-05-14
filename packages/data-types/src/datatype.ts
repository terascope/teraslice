
import { DataTypeManager, Type } from './interfaces';
import * as ts from '@terascope/utils';

// @ts-ignore
import { TypesManager } from './types';

interface DateType {
    [key: string]: any;
    $version: number;
}

export class DataTypes implements DataTypeManager {
    // @ts-ignore
    private types: Type[];
    // TODO: need name of data type?
    constructor({ $version: version, ...typesConfig }: DateType) {
        if (version == null) throw new ts.TSError('No $version was specified in type_config');
        const typeManager = new TypesManager(version);
        const types:Type[] = [];
        for (const key in typesConfig) {
            // ignore metadata settings
            if (key.charAt(0) !== '$') {
                const typeName = typesConfig[key];
                types.push(typeManager.getType(key, typeName));
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
        return {};
    }

}
