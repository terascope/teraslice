import * as es from 'elasticsearch';
import { escapeString, unescapeString, TSError, getField } from '@terascope/utils';
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
    async resolveDataType(id: string, options?: ResolveDataTypeOptions, queryAccess?: QueryAccess<DataType>): Promise<DataType> {
        const dataType = await this.findByAnyId(id, options, queryAccess);
        if (dataType.inherit_from && dataType.inherit_from.length) {
            dataType.config = await this.resolveTypeConfig(dataType, options, queryAccess);
        }
        return dataType;
    }

    async resolveTypeConfig(
        dataType: DataType,
        options?: ResolveDataTypeOptions,
        queryAccess?: QueryAccess<DataType>
    ): Promise<DataTypeConfig> {
        const dataTypes = await this._resolveDataTypes(dataType, [], options, queryAccess);
        const fields = this._mergeTypeConfigFields(dataTypes);

        const versions = dataTypes.map(({ config }) => getField(config, 'version'));
        // get the highest version
        const version = versions.reduce((acc, current) => {
            if (current > acc) return current;
            return acc;
        });
        return {
            version,
            fields,
        };
    }

    private async _resolveDataTypes(
        initialDataType: DataType,
        _resolved: ReadonlyArray<DataType>,
        options?: ResolveDataTypeOptions,
        queryAccess?: QueryAccess<DataType>
    ): Promise<ReadonlyArray<DataType>> {
        const version = initialDataType.config.version;
        let resolved: ReadonlyArray<DataType> = [initialDataType];

        const inheritFrom = initialDataType.inherit_from;
        if (!inheritFrom || !inheritFrom.length) return resolved;

        const validate = getField(options, 'validate', true);

        for (const id of inheritFrom) {
            const existing = _resolved.find(dt => dt.id === id);
            const dataType = await this.findById(id, options, queryAccess);

            if (existing) {
                const error = new TSError(`Circular reference to Data Type "${dataType.name}"`, {
                    statusCode: 422,
                    context: {
                        initialDataType,
                        resolved,
                    },
                });
                if (validate) {
                    throw error;
                } else {
                    this.logger.error(error);
                    continue;
                }
            }

            if (dataType.config.version && dataType.config.version !== version) {
                const latest = dataType.config.version > version ? dataType.config.version : version;
                const mainError = `Data Type "${dataType.name}" has a mismatched version`;
                const versionInfo = `expected version ${latest}`;
                const error = new TSError([mainError, versionInfo].join(', '), {
                    statusCode: 417,
                    context: {
                        initialDataType,
                        dataType,
                        resolved,
                    },
                });
                if (validate) {
                    throw error;
                } else {
                    this.logger.error(error);
                }
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

type ResolveDataTypeOptions = FindOneOptions<DataType> & {
    validate?: boolean;
};

export { DataType, ResolveDataTypeOptions };
