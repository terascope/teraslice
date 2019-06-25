import * as es from 'elasticsearch';
import { escapeString, unescapeString } from '@terascope/utils';
import { IndexModel, IndexModelOptions } from 'elasticsearch-store';
import { DataTypeConfig, LATEST_VERSION, TypeConfigFields } from '@terascope/data-types';
import dataTypesConfig, { DataType } from './config/data-types';

/**
 * Manager for DataTypes
 */
export class DataTypes extends IndexModel<DataType> {
    static IndexModelConfig = dataTypesConfig;

    constructor(client: es.Client, options: IndexModelOptions) {
        super(client, options, dataTypesConfig);
    }

    /**
     * Get the type configuration for a data type
     * including any merged fields
     */
    async getTypeConfig(id: string): Promise<DataTypeConfig> {
        const dataType = await this.findByAnyId(id);
        const dataTypes = await this._resolveDataTypes(dataType, []);
        const fields = this._mergeTypeConfigFields(dataTypes);
        if (dataType.inherit_from) {
            this.logger.trace('resolved data types', dataTypes);
        }

        return {
            version: dataType.config.version,
            fields,
        };
    }

    private async _resolveDataTypes(initialDataType: DataType, _resolved: ReadonlyArray<DataType>): Promise<ReadonlyArray<DataType>> {
        let resolved: ReadonlyArray<DataType> = [initialDataType];

        const inheritFrom = initialDataType.inherit_from;
        if (!inheritFrom || !inheritFrom.length) return resolved;

        for (const id of inheritFrom) {
            const existing = _resolved.find(dt => dt.id === id);
            if (existing) {
                // TODO this should blow up but we need a test first
            }

            const dataType = await this.findById(id);
            const moreDataTypes = await this._resolveDataTypes(dataType, resolved);
            // TODO verify the that versions match
            resolved = resolved.concat(moreDataTypes);
        }

        return resolved;
    }

    private _mergeTypeConfigFields(dataTypes: ReadonlyArray<DataType>): TypeConfigFields {
        const allFields = dataTypes.map(({ config }) => config.fields).reverse();
        return Object.assign({}, ...allFields);
    }

    private _escapeFields(typeConfig?: DataTypeConfig): DataTypeConfig {
        if (!typeConfig) {
            return {
                version: LATEST_VERSION,
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
                version: LATEST_VERSION,
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
        record.config = this._escapeFields(record.config);
        return record;
    }

    protected _postProcess(record: DataType): DataType {
        record.config = this._unescapeFields(record.config);
        return record;
    }
}

export { DataType };
