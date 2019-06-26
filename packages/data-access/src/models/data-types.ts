import * as es from 'elasticsearch';
import { escapeString, unescapeString, TSError } from '@terascope/utils';
import { IndexModel, IndexModelOptions, FindOneOptions } from 'elasticsearch-store';
import { DataTypeConfig, LATEST_VERSION, TypeConfigFields } from '@terascope/data-types';
import dataTypesConfig, { DataType } from './config/data-types';
import { QueryAccess } from 'xlucene-evaluator';

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
    async resolveDataType(id: string, options?: FindOneOptions<DataType>, queryAccess?: QueryAccess<DataType>): Promise<DataType> {
        const dataType = await this.findByAnyId(id, options, queryAccess);
        if (dataType.inherit_from && dataType.inherit_from.length) {
            dataType.config = await this.resolveTypeConfig(dataType, options, queryAccess);
        }
        return dataType;
    }

    async resolveTypeConfig(
        dataType: DataType,
        options?: FindOneOptions<DataType>,
        queryAccess?: QueryAccess<DataType>
    ): Promise<DataTypeConfig> {
        const dataTypes = await this._resolveDataTypes(dataType, [], options, queryAccess);
        const fields = this._mergeTypeConfigFields(dataTypes);

        return {
            version: dataType.config.version,
            fields,
        };
    }

    private async _resolveDataTypes(
        initialDataType: DataType,
        _resolved: ReadonlyArray<DataType>,
        options?: FindOneOptions<DataType>,
        queryAccess?: QueryAccess<DataType>
    ): Promise<ReadonlyArray<DataType>> {
        const version = initialDataType.config.version;
        let resolved: ReadonlyArray<DataType> = [initialDataType];

        const inheritFrom = initialDataType.inherit_from;
        if (!inheritFrom || !inheritFrom.length) return resolved;

        for (const id of inheritFrom) {
            const existing = _resolved.find(dt => dt.id === id);
            if (existing) {
                throw new TSError('Circular reference to Data Type', {
                    statusCode: 422,
                    context: {
                        initialDataType,
                        resolved,
                    },
                });
            }

            const dataType = await this.findById(id, options, queryAccess);
            if (dataType.config.version && dataType.config.version !== version) {
                // FIX?
                this.logger.error(
                    new TSError('Data Type config version mistmatch', {
                        statusCode: 422,
                        context: {
                            initialDataType,
                            dataType,
                            resolved,
                        },
                    })
                );
                continue;
            }

            const moreDataTypes = await this._resolveDataTypes(dataType, resolved, options, queryAccess);
            resolved = resolved.concat(moreDataTypes);
        }

        return resolved;
    }

    private _mergeTypeConfigFields(dataTypes: ReadonlyArray<DataType>): TypeConfigFields {
        const allFields = dataTypes.map(({ config }) => config.fields).reverse();
        const fields = Object.assign({}, ...allFields);
        this.logger.trace('resolved data types', dataTypes, '\n -> to', fields);
        return fields;
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
