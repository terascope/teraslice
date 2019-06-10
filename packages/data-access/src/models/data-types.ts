import * as es from 'elasticsearch';
import { TypeConfig } from 'xlucene-evaluator';
import { escapeString, unescapeString } from '@terascope/utils';
import { IndexModel, IndexModelOptions } from 'elasticsearch-store';
import dataTypesConfig, { DataType } from './config/data-types';

/**
 * Manager for DataTypes
 */
export class DataTypes extends IndexModel<DataType> {
    static IndexModelConfig = dataTypesConfig;

    constructor(client: es.Client, options: IndexModelOptions) {
        super(client, options, dataTypesConfig);
    }

    private _escapeFields(typeConfig?: TypeConfig): TypeConfig {
        if (!typeConfig) return {};

        const updated: TypeConfig = {};
        for (const [field, value] of Object.entries(typeConfig)) {
            updated[escapeString(field, ['.'])] = value;
        }
        return updated;
    }

    private _unescapeFields(typeConfig?: TypeConfig): TypeConfig {
        if (!typeConfig) return {};

        const updated: TypeConfig = {};
        for (const [field, value] of Object.entries(typeConfig)) {
            if (!value) continue;
            const unescaped = unescapeString(field);
            updated[unescaped] = value;
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
