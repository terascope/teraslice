import * as es from 'elasticsearch';
import { escapeString, unescapeString } from '@terascope/utils';
import { IndexModel, IndexModelOptions } from 'elasticsearch-store';
import dataTypesConfig, { DataType } from './config/data-types';
import { DataTypeConfig } from '@terascope/data-types';

/**
 * Manager for DataTypes
 */
export class DataTypes extends IndexModel<DataType> {
    static IndexModelConfig = dataTypesConfig;

    constructor(client: es.Client, options: IndexModelOptions) {
        super(client, options, dataTypesConfig);
    }

    private _escapeFields(typeConfig?: DataTypeConfig): DataTypeConfig {
        if (!typeConfig) {
            return {
                version: 1,
                fields: {},
            };
        }

        const updated: DataTypeConfig = {
            version: typeConfig.version || 1,
            fields: {},
        };

        for (const [field, value] of Object.entries(typeConfig.fields)) {
            updated.fields[escapeString(field, ['.'])] = value;
        }

        return updated;
    }

    private _unescapeFields(typeConfig?: DataTypeConfig): DataTypeConfig {
        if (!typeConfig) {
            return {
                version: 1,
                fields: {},
            };
        }

        const updated: DataTypeConfig = {
            version: typeConfig.version || 1,
            fields: {},
        };

        for (const [field, value] of Object.entries(typeConfig.fields)) {
            if (!value) continue;
            const unescaped = unescapeString(field);
            updated.fields[unescaped] = value;
        }

        return updated;
    }

    protected _preProcess(record: DataType): DataType {
        record.type_config = this._escapeFields(record.type_config);
        return record;
    }

    protected _postProcess(record: DataType): DataType {
        record.type_config = this._unescapeFields(record.type_config);
        return record;
    }
}

export { DataType };
