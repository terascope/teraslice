import * as es from 'elasticsearch';
import * as ts from '@terascope/utils';
import { QueryAccess } from 'xlucene-evaluator';
import IndexStore from './index-store';
import * as utils from './utils';
import * as i from './interfaces';

/**
 * An high-level, opionionated, abstract class
 * for an elasticsearch DataType, with a CRUD-like interface
 */
export default abstract class IndexModel<T extends i.IndexModelRecord> {
    readonly store: IndexStore<T>;
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
                log_level: modelConfig.strict_mode === false ? 'trace' : 'warn',
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
            id_field: 'id',
            ingest_time_field: 'created',
            event_time_field: 'updated',
            logger: options.logger,
            default_sort: 'updated:desc',
        };

        this.name = utils.toInstanceName(modelConfig.name);
        this.store = new IndexStore(client, indexConfig);

        const debugLoggerName = `elasticsearch-store:index-model:${this.name}`;
        this.logger = options.logger || ts.debugLogger(debugLoggerName);

        this._uniqueFields = ts.concat('id', modelConfig.unique_fields);
        this._sanitizeFields = modelConfig.sanitize_fields || {};
    }

    get xluceneTypeConfig() {
        return this.store.xluceneTypeConfig;
    }

    async initialize() {
        return this.store.initialize();
    }

    async shutdown() {
        return this.store.shutdown();
    }

    async count(q = '', queryAccess?: QueryAccess<T>): Promise<number> {
        if (queryAccess) return this.store.count(queryAccess.restrict(q));
        return this.store.count(q);
    }

    async countBy(fields: AnyInput<T>, joinBy?: JoinBy, arrayJoinBy?: JoinBy): Promise<number> {
        return this.store.count(this._createJoinQuery(fields, joinBy, arrayJoinBy));
    }

    async create(record: i.CreateRecordInput<T>): Promise<T> {
        const docInput = {
            ...record,
            created: ts.makeISODate(),
            updated: ts.makeISODate(),
        } as T;

        const id = await utils.makeId();
        docInput.id = id;

        const doc = this._sanitizeRecord(docInput);

        await this._ensureUnique(doc);
        await this.store.createWithId(doc, id);

        // @ts-ignore
        return ts.DataEntity.make(this._postProcess(doc));
    }

    async deleteById(id: string): Promise<void> {
        await this.store.remove(id);
    }

    async deleteAll(ids: string[]): Promise<void> {
        if (!ids || !ids.length) return;

        await Promise.all(ts.uniq(ids).map((id) => this.deleteById(id)));
    }

    async exists(id: string[] | string): Promise<boolean> {
        const ids = ts.castArray(id);
        if (!ids.length) return true;

        const count = await this.countBy({
            id: ids,
        } as AnyInput<T>);

        return count === ids.length;
    }

    async findBy(
        fields: AnyInput<T>,
        joinBy?: JoinBy,
        options?: i.FindOneOptions<T>,
        queryAccess?: QueryAccess<T>
    ) {
        const query = this._createJoinQuery(fields, joinBy);

        const results = await this._find(
            query,
            {
                ...options,
                size: 1,
            },
            queryAccess
        );

        const record = ts.getFirst(results);
        if (record == null) {
            throw new ts.TSError(`Unable to find ${this.name} by ${query}`, {
                statusCode: 404,
            });
        }

        return record;
    }

    async findById(
        id: string,
        options?: i.FindOneOptions<T>,
        queryAccess?: QueryAccess<T>
    ): Promise<T> {
        const fields = { id } as Partial<T>;
        return this.findBy(fields, 'AND', options, queryAccess);
    }

    async findByAnyId(anyId: any, options?: i.FindOneOptions<T>, queryAccess?: QueryAccess<T>) {
        const fields: Partial<T> = {};

        for (const field of this._uniqueFields) {
            fields[field] = anyId;
        }

        return this.findBy(fields, 'OR', options, queryAccess);
    }

    async findAndApply(
        updates: Partial<T> | undefined,
        options?: i.FindOneOptions<T>,
        queryAccess?: QueryAccess<T>
    ): Promise<Partial<T>> {
        if (!updates) {
            throw new ts.TSError(`Invalid input for ${this.name}`, {
                statusCode: 422,
            });
        }

        const { id } = updates;
        if (!id) return { ...updates };

        const current = await this.findById(id, options, queryAccess);
        return { ...current, ...updates };
    }

    async findAll(
        input: string[] | string | undefined,
        options?: i.FindOneOptions<T>,
        queryAccess?: QueryAccess<T>
    ): Promise<T[]> {
        const ids: string[] = ts.parseList(input);
        if (!ids || !ids.length) return [];

        const query = this._createJoinQuery({ id: ids } as AnyInput<T>);

        const result = await this._find(
            query,
            {
                ...options,
                size: ids.length,
            },
            queryAccess
        );

        if (result.length !== ids.length) {
            const foundIds = result.map((doc) => doc.id);
            const notFoundIds = ids.filter((id) => !foundIds.includes(id));
            throw new ts.TSError(`Unable to find ${this.name}'s ${notFoundIds.join(', ')}`, {
                statusCode: 404,
            });
        }

        // maintain sort order
        return ids.map((id) => result.find((doc) => doc.id === id)!);
    }

    async find(q = '', options: i.FindOptions<T> = {}, queryAccess?: QueryAccess<T>): Promise<T[]> {
        return this._find(q, options, queryAccess);
    }

    async update(record: i.UpdateRecordInput<T>) {
        const { id } = record;
        if (!id || !ts.isString(id)) {
            throw new ts.TSError(`${this.name} update requires id`, {
                statusCode: 422,
            });
        }

        return this.store.updatePartial(id, async (existing) => {
            const doc = this._sanitizeRecord({
                ...existing,
                ...record,
                updated: ts.makeISODate(),
            } as T);

            await this._ensureUnique(doc, existing);
            return doc;
        });
    }

    protected async _updateWith(id: string, body: any): Promise<void> {
        await this.store.update(body, id);
    }

    protected async _appendToArray(
        id: string,
        field: keyof T,
        values: string[] | string
    ): Promise<void> {
        const valueArray = values && ts.uniq(ts.castArray(values)).filter((v) => !!v);
        if (!valueArray || !valueArray.length) return;

        await this._updateWith(id, {
            script: {
                source: `
                    for(int i = 0; i < params.values.length; i++) {
                        if (!ctx._source["${field}"].contains(params.values[i])) {
                            ctx._source["${field}"].add(params.values[i])
                        }
                    }
                `,
                lang: 'painless',
                params: {
                    values: valueArray,
                },
            },
        });
    }

    protected async _removeFromArray(
        id: string,
        field: keyof T,
        values: string[] | string
    ): Promise<void> {
        const valueArray = values && ts.uniq(ts.castArray(values)).filter((v) => !!v);
        if (!valueArray || !valueArray.length) return;

        try {
            await this._updateWith(id, {
                script: {
                    source: `
                        for(int i = 0; i < params.values.length; i++) {
                            if (ctx._source["${field}"].contains(params.values[i])) {
                                int itemIndex = ctx._source["${field}"].indexOf(params.values[i]);
                                ctx._source["${field}"].remove(itemIndex)
                            }
                        }
                    `,
                    lang: 'painless',
                    params: {
                        values: valueArray,
                    },
                },
            });
        } catch (err) {
            if (err && err.statusCode === 404) {
                return;
            }
            throw err;
        }
    }

    protected async _find(q = '', options: i.FindOptions<T> = {}, queryAccess?: QueryAccess<T>) {
        const params: Partial<es.SearchParams> = {
            size: options.size,
            sort: options.sort,
            from: options.from,
            _sourceExclude: options.excludes as string[],
            _sourceInclude: options.includes as string[],
        };

        let records: T[];
        if (queryAccess) {
            const query = queryAccess.restrictSearchQuery(q, {
                params,
                elasticsearch_version: utils.getESVersion(this.store.client)
            });
            records = await this.store._search(query);
        } else {
            records = await this.store.search(q, params);
        }

        return records.map((record) => this._postProcess(record));
    }

    protected async _ensureUnique(record: T, existing?: T) {
        for (const field of this._uniqueFields) {
            if (field === 'id') continue;
            if (field === 'client_id') continue;
            if (!existing && record[field] == null) {
                throw new ts.TSError(`${this.name} requires field ${field}`, {
                    statusCode: 422,
                });
            }
            if (existing && existing[field] === record[field]) continue;

            const count = await this.countBy({
                [field]: record[field],
                ...(record.client_id && {
                    client_id: [record.client_id, 0],
                }),
            } as AnyInput<T>);

            if (count > 0) {
                throw new ts.TSError(`${this.name} requires ${field} to be unique`, {
                    statusCode: 409,
                });
            }
        }
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

        return this._preProcess(record);
    }

    protected _postProcess(record: T): T {
        return record;
    }

    protected _preProcess(record: T): T {
        return record;
    }

    protected _createJoinQuery(fields: AnyInput<T>, joinBy: JoinBy = 'AND', arrayJoinBy: JoinBy = 'OR'): string {
        return Object.entries(fields)
            .map(([field, val]) => {
                if (val == null) {
                    throw new ts.TSError(`${this.name} missing value for field "${field}"`, {
                        statusCode: 422,
                    });
                }
                let value: string;
                if (Array.isArray(val)) {
                    if (val.length > 1) {
                        value = `(${ts
                            .uniq(val)
                            .map(escapeValue)
                            .join(` ${arrayJoinBy} `)})`;
                    } else {
                        value = escapeValue(val);
                    }
                } else {
                    value = escapeValue(val);
                }
                return `${field}: ${value}`;
            })
            .join(` ${joinBy} `);
    }
}

type AnyInput<T> = { [P in keyof T]?: T[P] | any };

type JoinBy = 'AND' | 'OR';

const escapeChars: string[] = ['"', '(', ')'];
function escapeValue(val: any) {
    return `"${ts.escapeString(`${val}`, escapeChars)}"`;
}
