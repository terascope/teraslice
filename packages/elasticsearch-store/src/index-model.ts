import * as es from 'elasticsearch';
import * as ts from '@terascope/utils';
import { LuceneQueryAccess } from 'xlucene-evaluator';
import IndexStore from './index-store';
import * as utils from './utils';
import * as i from './interfaces';

/**
 * An abstract class for an elasticsearch resource, with a CRUD-like interface
*/
export default abstract class IndexModel<T extends i.IndexModelRecord> {
    readonly store: IndexStore<T>;
    readonly name: string;
    private _uniqueFields: (keyof T)[];
    private _sanitizeFields: i.SanitizeFields;
    private _idField: keyof T;

    constructor(client: es.Client, options: i.IndexModelOptions, modelConfig: i.IndexModelConfig<T>) {
        const baseConfig: i.IndexConfig<T> = {
            version: 1,
            name: modelConfig.name,
            namespace: options.namespace,
            indexSchema: {
                version: modelConfig.version,
                mapping: utils.addDefaultMapping(modelConfig.mapping),
            },
            dataSchema: {
                schema: utils.addDefaultSchema(modelConfig.schema),
                strict: modelConfig.strictMode === false ? false : true,
                allFormatters: true,
            },
            indexSettings: {
                'index.number_of_shards': ts.isProd ? 5 : 1,
                'index.number_of_replicas': ts.isProd ? 1 : 0,
                analysis: {
                    analyzer: {
                        lowercase_keyword_analyzer: {
                            tokenizer: 'keyword',
                            filter: 'lowercase'
                        }
                    }
                }
            },
            idField: 'id',
            ingestTimeField: 'created',
            eventTimeField: 'updated',
            logger: options.logger,
            defaultSort: 'updated:desc'
        };

        const indexConfig = Object.assign(
            baseConfig,
            options.storeOptions,
            modelConfig.storeOptions
        );

        this.name = utils.toInstanceName(modelConfig.name);
        this.store = new IndexStore(client, indexConfig);

        this._idField = indexConfig.idField!;
        this._uniqueFields = ts.concat(this._idField, modelConfig.uniqueFields);
        this._sanitizeFields = modelConfig.sanitizeFields || {};
    }

    async initialize() {
        return this.store.initialize();
    }

    async shutdown() {
        return this.store.shutdown();
    }

    async count(query: string, queryAccess?: LuceneQueryAccess<T>): Promise<number> {
        if (queryAccess) return this.store.count(queryAccess.restrict(query));
        return this.store.count(query);
    }

    async create(record: i.CreateRecordInput<T>): Promise<T> {
        const docInput = {
            ...record,
            created: ts.makeISODate(),
            updated: ts.makeISODate(),
        } as T;

        const id = await utils.makeId();
        docInput[this._idField] = id as any;

        const doc = this._sanitizeRecord(docInput as T);

        await this._ensureUnique(doc);
        await this.store.indexWithId(doc, id);

        // @ts-ignore
        return ts.DataEntity.make(doc);
    }

    async deleteById(id: string): Promise<void> {
        await this.store.remove(id, {
            refresh: true
        });
    }

    async deleteAll(ids: string[]): Promise<void> {
        if (!ids || !ids.length) return;

        await Promise.all(ids.map((id) => this.deleteById(id)));
    }

    async exists(id: string[]|string): Promise<boolean> {
        const ids = ts.castArray(id);
        if (!ids.length) return true;

        const idQuery = ids.join(' OR ');
        const count = await this.store.count(`${this._idField}: (${idQuery})`);

        return count === ids.length;
    }

    async findBy(fields: Partial<T>, joinBy = 'AND', options?: FindOneOptions<T>, queryAccess?: LuceneQueryAccess<T>) {
        const query = Object.entries(fields)
            .map(([field, val]) => {
                if (val == null) {
                    throw new ts.TSError(`${this.name} missing value for field "${field}"`, {
                        statusCode: 422
                    });
                }
                return `${field}: "${val}"`;
            })
            .join(` ${joinBy} `);

        const results = await this._find(query, {
            ...options,
            size: 1
        }, queryAccess);

        const record = ts.getFirst(results);
        if (record == null) {
            throw new ts.TSError(`Unable to find ${this.name} by ${query}`, {
                statusCode: 404,
            });
        }

        return record;
    }

    async findById(id: string, options?: FindOneOptions<T>, queryAccess?: LuceneQueryAccess<T>): Promise<T> {
        const fields: Partial<T> = { };
        fields[this._idField] = id as any;
        return this.findBy(fields, 'AND', options, queryAccess);
    }

    async findByAnyId(anyId: any, options?: FindOneOptions<T>, queryAccess?: LuceneQueryAccess<T>) {
        const fields: Partial<T> = {};

        for (const field of this._uniqueFields) {
            fields[field] = anyId;
        }

        return this.findBy(fields, 'OR', options, queryAccess);
    }

    async findAll(input: string[]|string, options?: FindOneOptions<T>, queryAccess?: LuceneQueryAccess<T>) {
        const ids: string[] = ts.parseList(input);
        if (!ids || !ids.length) return [];

        const query = `${this._idField}: (${ids.join(' OR ')})`;

        const result = await this._find(query, {
            ...options,
            size: ids.length
        }, queryAccess);

        if (result.length !== ids.length) {
            const foundIds = result.map((doc) => doc.id);
            const notFoundIds = ids.filter((id) => !foundIds.includes(id));
            throw new ts.TSError(`Unable to find documents ${notFoundIds.join(', ')}`, {
                statusCode: 404
            });
        }
        return result;
    }

    async find(q: string = '*', options: FindOptions<T> = {}, queryAccess?: LuceneQueryAccess<T>): Promise<T[]> {
        return this._find(q, options, queryAccess);
    }

    async update(record: i.UpdateRecordInput<T>) {
        const doc: T = this._sanitizeRecord({
            ...record,
            updated: ts.makeISODate(),
        } as T);

        const id: unknown = doc[this._idField];
        if (!id) {
            throw new ts.TSError(`${this.name} update requires ${this._idField}`, {
                statusCode: 422
            });
        }

        const existing = await this.store.get(id as string);

        for (const field of this._uniqueFields) {
            if (field === 'id') continue;
            if (doc[field] == null) continue;

            if (existing[field] !== doc[field]) {
                const count = await this._countBy(field, doc[field]);

                if (count > 0) {
                    throw new ts.TSError(`${this.name} update requires ${field} to be unique`, {
                        statusCode: 409
                    });
                }
            }
        }

        await this.store.update({ doc }, doc.id, {
            refresh: true,
        });
    }

    protected async _updateWith(id: string, body: any): Promise<void> {
        await this.store.update(body, id);
    }

    protected async _appendToArray(id: string, field: keyof T, values: string[]|string): Promise<void> {
        if (!values || !values.length) return;

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
                    values: ts.uniq(ts.castArray(values)),
                }
            }
        });
    }

    protected async _removeFromArray(id: string, field: keyof T, values: string[]|string): Promise<void> {
        if (!values || !values.length) return;

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
                        values: ts.uniq(ts.castArray(values)),
                    }
                }
            });
        } catch (err) {
            if (err && err.statusCode === 404) {
                return;
            }
            throw err;
        }
    }

    /** this is only used for counting uniq fields */
    protected async _countBy(field: keyof T, val: any): Promise<number> {
        if (!val) return 0;
        return this.store.count(`${field}:"${val}"`);
    }

    protected async _find(q: string = '*', options: FindOptions<T> = {}, queryAccess?: LuceneQueryAccess<T>) {
        const params: Partial<es.SearchParams> = {
            size: options.size,
            sort: options.sort,
            from: options.from,
            _sourceExclude: options.excludes as string[],
            _sourceInclude: options.includes as string[],
        };

        if (queryAccess) {
            const query = queryAccess.restrictSearchQuery(q, params);
            return this.store._search(query);
        }

        return this.store.search(q, params);
    }

    protected async _ensureUnique(record: T) {
        for (const field of this._uniqueFields) {
            if (field === this._idField) continue;
            if (record[field] == null) {
                throw new ts.TSError(`${this.name} create requires field ${field}`, {
                    statusCode: 422
                });
            }

            const count = await this._countBy(field, record[field]);
            if (count > 0) {
                throw new ts.TSError(`${this.name} create requires ${field} to be unique`, {
                    statusCode: 409
                });
            }
        }

        return;
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
}

export type FindOptions<T> = {
    includes?: (keyof T)[],
    excludes?: (keyof T)[],
    from?: number;
    sort?: string;
    size?: number;
};

export type FindOneOptions<T> = {
    includes?: (keyof T)[],
    excludes?: (keyof T)[],
};
