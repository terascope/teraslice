import * as es from 'elasticsearch';
import * as ts from '@terascope/utils';
import { QueryAccess, JoinBy } from 'xlucene-evaluator';
import IndexStore, { AnyInput } from './index-store';
import * as utils from './utils';
import * as i from './interfaces';

/**
 * An high-level, opionionated, abstract class
 * for an elasticsearch DataType, with a CRUD-like interface
 */
export default abstract class IndexModel<T extends i.IndexModelRecord> extends IndexStore<T> {
    readonly name: string;
    readonly logger: ts.Logger;

    private _uniqueFields: (keyof T)[];
    private _sanitizeFields: i.SanitizeFields;

    constructor(
        client: es.Client,
        options: i.IndexModelOptions,
        modelConfig: i.IndexModelConfig<T>
    ) {
        const baseConfig: i.IndexConfig<T> = {
            version: 1,
            name: modelConfig.name,
            namespace: options.namespace,
            index_schema: {
                version: modelConfig.version,
                mapping: utils.addDefaultMapping(modelConfig.mapping),
            },
            data_schema: {
                schema: utils.addDefaultSchema(modelConfig.schema),
                strict: modelConfig.strict_mode !== false,
                all_formatters: true,
            },
            index_settings: {
                'index.number_of_shards': ts.isProd ? 5 : 1,
                'index.number_of_replicas': ts.isProd ? 1 : 0,
                analysis: {
                    analyzer: {
                        lowercase_keyword_analyzer: {
                            tokenizer: 'keyword',
                            filter: 'lowercase',
                        },
                    },
                },
            },
        };

        const indexConfig: i.IndexConfig<T> = {
            ...baseConfig,
            id_field: '_key',
            ingest_time_field: '_created',
            event_time_field: '_updated',
            logger: options.logger,
            default_sort: '_updated:desc',
        };

        super(client, indexConfig);
        this.name = utils.toInstanceName(modelConfig.name);
        const debugLoggerName = `elasticsearch-store:index-model:${this.name}`;
        this.logger = options.logger || ts.debugLogger(debugLoggerName);

        this._uniqueFields = ts.concat('_key', modelConfig.unique_fields);
        this._sanitizeFields = modelConfig.sanitize_fields || {};

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
    ) {
        utils.validateId(anyId, 'fetchRecord');
        const fields: Partial<T> = {};

        for (const field of this._uniqueFields) {
            fields[field] = anyId as any;
        }

        return this.findBy(fields, 'OR', options, queryAccess);
    }

    async createRecord(record: i.CreateRecordInput<T>): Promise<T> {
        const docInput = {
            ...record,
            _deleted: false,
            _created: ts.makeISODate(),
            _updated: ts.makeISODate(),
        } as T;

        const id = await utils.makeId();
        docInput._key = id;

        const doc = this._sanitizeRecord(docInput);

        await this._ensureUnique(doc);
        return this.createById(id, doc);
    }

    async updateRecord(id: string, record: i.UpdateRecordInput<T>): Promise<T> {
        utils.validateId(id, 'updateRecord');

        return this.updatePartial(id, async (existing) => {
            const doc = this._sanitizeRecord({
                ...existing,
                ...record,
                _updated: ts.makeISODate(),
                _key: id
            } as T);

            await this._ensureUnique(doc, existing);
            return doc;
        });
    }

    /**
     * Soft deletes a record by ID
     */
    async deleteRecord(id: string, clientId?: number): Promise<boolean> {
        utils.validateId(id, 'deleteRecord');

        const exists = await this.recordExists(id, clientId);
        if (!exists) return false;

        await this.update(id, {
            doc: {
                _deleted: true
            } as Partial<T>
        });

        return true;
    }

    /**
     * Soft deletes records by ID
     */
    async deleteRecords(ids: string[]): Promise<void> {
        if (!ids || !ids.length) return;

        await Promise.all(ts.uniq(ids).map((id) => this.deleteRecord(id)));
    }

    async countRecords(
        fields: AnyInput<T>,
        clientId?: number,
        joinBy?: JoinBy,
        arrayJoinBy?: JoinBy
    ): Promise<number> {
        return this.countBy({
            ...fields,
            ...(clientId && clientId > 0 && {
                client_id: [clientId, 0],
            }),
            _deleted: false
        }, joinBy, arrayJoinBy);
    }

    async recordExists(id: string[] | string, clientId?: number): Promise<boolean> {
        const ids = utils.validateIds(id, 'recordExists');
        if (!ids.length) return true;

        const count = await this.countRecords({
            [this.config.id_field!]: ids,
        } as AnyInput<T>, clientId);

        return count === ids.length;
    }

    protected _sanitizeRecord(record: T): T {
        const entries = Object.entries(this._sanitizeFields);

        for (const [field, method] of entries) {
            if (!record[field]) continue;

            switch (method) {
                case 'trim':
                    record[field] = ts.trim(record[field]);
                    break;
                case 'trimAndToLower':
                    record[field] = ts.trimAndToLower(record[field]);
                    break;
                case 'toSafeString':
                    record[field] = ts.toSafeString(record[field]);
                    break;
                default:
                    continue;
            }
        }

        return record;
    }

    protected async _ensureUnique(record: T, existing?: T) {
        for (const field of this._uniqueFields) {
            if (field === '_key') continue;
            if (field === 'client_id') continue;
            if (!existing && record[field] == null) {
                throw new ts.TSError(`${this.name} requires field ${field}`, {
                    statusCode: 422,
                });
            }
            if (existing && existing[field] === record[field]) continue;

            const count = await this.countRecords({
                [field]: record[field],
            } as AnyInput<T>, record.client_id);

            if (count > 0) {
                throw new ts.TSError(`${this.name} requires ${field} to be unique`, {
                    statusCode: 409,
                });
            }
        }
    }
}
