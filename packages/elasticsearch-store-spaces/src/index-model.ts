import {
    isTest, debugLogger, concat,
    Logger, makeISODate, toSafeString,
    trim, trimAndToLower, TSError, isKey
} from '@terascope/utils';
import { JoinBy } from '@terascope/data-mate';
import { QueryAccess, RestrictOptions } from 'xlucene-translator';
import { v4 as uuid } from 'uuid';
import { Client } from 'elasticsearch-store';
import { IndexStore, AnyInput } from './index-store.js';
import {
    addDefaultSchema, toInstanceName, validateId,
    validateIds, uniqueFieldQuery
} from './utils/index.js';
import * as i from './interfaces.js';

/**
 * An high-level, opinionated, abstract class
 * for an elasticsearch DataType, with a CRUD-like interface
 */
export abstract class IndexModel<T extends i.IndexModelRecord> extends IndexStore<T> {
    readonly name: string;
    readonly logger: Logger;

    private _uniqueFields: readonly (keyof T)[];
    private _sanitizeFields: i.SanitizeFields<T> | undefined;

    constructor(
        client: Client,
        options: i.IndexModelOptions,
        modelConfig: i.IndexModelConfig<T>
    ) {
        const {
            timeseries,
            version,
            schema,
            strict_mode,
            index_settings,
            unique_fields: uniqueFields,
            sanitize_fields: sanitizeFields,
            ...indexConfigOptions
        } = modelConfig;

        const indexConfig: i.IndexConfig<T> = {
            index_schema: timeseries
                ? {
                    version,
                    template: true,
                    timeseries: true,
                    rollover_frequency: options.rollover_frequency
                }
                : {
                    version,
                },
            data_schema: {
                schema: addDefaultSchema(schema),
                strict: strict_mode !== false,
                all_formatters: true,
                validate_on_read: false,
            },
            index_settings: {
                'index.number_of_shards': isTest ? 1 : 5,
                'index.number_of_replicas': isTest ? 0 : 2,
                ...index_settings
            },
            default_query_access: new QueryAccess({
                type_config: modelConfig.data_type.toXlucene(),
                constraint: '_deleted: false',
            }),
            enable_index_mutations: options.enable_index_mutations,
            namespace: options.namespace,
            id_field: '_key',
            ingest_time_field: '_created',
            event_time_field: '_updated',
            logger: options.logger,
            default_sort: '_updated:desc',
            ...indexConfigOptions,
            version: 1,
        };

        super(client, indexConfig);

        this.name = toInstanceName(this.config.name);
        const debugLoggerName = `elasticsearch-store:index-model:${this.name}`;
        this.logger = options.logger || debugLogger(debugLoggerName);

        this._uniqueFields = concat('_key', uniqueFields);
        if (sanitizeFields) {
            this._sanitizeFields = sanitizeFields;
        }

        this.readHooks.add((doc) => {
            if (doc._deleted) return false;
            return doc;
        });
    }

    /**
     * Fetch a record by any unique ID
    */
    async fetchRecord(
        anyId: string,
        options?: i.FindOneOptions<T>,
        queryAccess?: QueryAccess<T>
    ): Promise<T> {
        validateId(anyId, 'fetchRecord');
        const fields: Partial<T> = {};

        for (const field of this._uniqueFields) {
            fields[field] = anyId as any;
        }

        return this.findBy(fields, 'OR', options, queryAccess);
    }

    async createRecord(record: i.CreateRecordInput<T>, allowOverrides?: boolean): Promise<T> {
        const doc = this._createRecord(record, allowOverrides);
        await this._ensureUnique(doc);
        return this.createById(doc._key, doc);
    }

    private _createRecord(record: i.CreateRecordInput<T>, allowOverrides?: boolean): T {
        const docInput = allowOverrides
            ? {
                _created: makeISODate(),
                _updated: makeISODate(),
                ...record,
                _deleted: false,
            } as T
            : {
                ...record,
                _created: makeISODate(),
                _updated: makeISODate(),
                _deleted: false,
            } as T;

        const id = allowOverrides && docInput._key ? docInput._key : uuid();
        docInput._key = id;

        return this._sanitizeRecord(docInput);
    }

    async updateRecord(id: string, record: i.UpdateRecordInput<T>): Promise<T> {
        validateId(id, 'updateRecord');

        return this.updatePartial(id, async (existing) => {
            const doc = this._sanitizeRecord({
                ...existing,
                ...record,
                _updated: makeISODate(),
                _key: id
            } as T);

            await this._ensureUnique(doc, existing);
            return doc;
        });
    }

    /**
     * Create a bulk records and put it them into bulk request queue
     */
    async bulkCreateRecords(
        records: i.CreateRecordInput<T>[],
        allowOverrides?: boolean
    ): Promise<void> {
        for (const record of records) {
            const doc = this._createRecord(record, allowOverrides);
            await this.bulk('index', doc, doc._key);
        }
    }

    /**
     * Soft deletes a record by ID
     */
    async deleteRecord(id: string, clientId?: number): Promise<boolean> {
        validateId(id, 'deleteRecord');

        const exists = await this.recordExists(id, clientId);
        if (!exists) return false;

        await this.update(id, {
            doc: {
                _deleted: true
            } as Partial<T>
        });

        return true;
    }

    async countRecords(
        fields: AnyInput<T>,
        clientId?: number,
        joinBy?: JoinBy,
        options?: RestrictOptions,
        queryAccess?: QueryAccess<T>,
    ): Promise<number> {
        return this.countBy({
            ...fields,
            ...(clientId && clientId > 0 && {
                client_id: [clientId, 0],
            }),
            _deleted: false
        }, joinBy, options, queryAccess);
    }

    async recordExists(id: string[] | string, clientId?: number): Promise<boolean> {
        const ids = validateIds(id, 'recordExists');
        if (!ids.length) return false;

        const count = await this.countRecords({
            [this.config.id_field!]: ids,
        } as AnyInput<T>, clientId);

        return count === ids.length;
    }

    private _setStringValueOrThrow<K extends keyof T>(obj: T, key: K, value: string) {
        if (typeof obj[key] === 'string') {
            obj[key] = value as T[K];
        } else {
            throw new Error(`Cannot assign a string to a property of type ${typeof obj[key]}`);
        }
    }

    protected _sanitizeRecord(record: T): T {
        if (this._sanitizeFields) {
            const entries = Object.entries(this._sanitizeFields);

            for (const [field, method] of entries) {
                if (isKey(record, field) && record[field]) {
                    switch (method) {
                        case 'trim':
                            this._setStringValueOrThrow(
                                record,
                                field,
                                trim(record[field])
                            );
                            break;
                        case 'trimAndToLower':
                            this._setStringValueOrThrow(
                                record,
                                field,
                                trimAndToLower(record[field] as string)
                            );
                            break;
                        case 'toSafeString':
                            this._setStringValueOrThrow(
                                record,
                                field,
                                toSafeString(record[field] as string)
                            );
                            break;
                        default:
                            continue;
                    }
                }
            }
        }

        return record;
    }

    protected async _ensureUnique(record: T, existing?: T): Promise<void> {
        for (const field of this._uniqueFields) {
            if (field === '_key') continue;
            if (field === 'client_id') continue;
            if (!existing && record[field] == null) {
                throw new TSError(`${this.name} requires field ${String(field)}`, {
                    statusCode: 422,
                });
            }
            if (existing && existing[field] === record[field]) continue;

            const fieldKey = this._hasTextAnalyzer(field) ? `${String(field)}.text` : String(field);

            let query = `${fieldKey}:${uniqueFieldQuery(String(record[field]))}`;

            if (record.client_id && record.client_id > 0) {
                query += ` AND client_id: ${record.client_id}`;
            }

            query += ' AND _deleted:false';

            const count = await this.count(query);

            if (count > 0) {
                throw new TSError(`${this.name} requires ${String(field)} to be unique`, {
                    statusCode: 409,
                });
            }
        }
    }

    private _hasTextAnalyzer(field: keyof T): boolean {
        const fieldConfig = this.config.data_type.fields[field as string];
        if (!fieldConfig) return false;
        if (fieldConfig.type !== 'KeywordCaseInsensitive') return false;
        if (!fieldConfig.use_fields_hack) return false;
        return true;
    }
}
