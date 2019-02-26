import * as es from 'elasticsearch';
import { IndexStore, IndexConfig } from 'elasticsearch-store';
import * as ts from '@terascope/utils';
import * as utils from '../utils';
import { addDefaultMapping, addDefaultSchema } from './config/base';
import { ManagerConfig } from '../interfaces';

/**
 * A base class for handling the different ACL models
*/
export class Base<T extends BaseModel, C extends object = T, U extends object = T> {
    readonly store: IndexStore<T>;
    readonly name: string;
    private _fixDoc: FixDocFn<T> = (doc: T) => doc;
    private _uniqueFields: (keyof T)[];
    private _sanitizeFields: SanitizeFields;

    constructor(client: es.Client, config: ManagerConfig, modelConfig: ModelConfig<T>) {
        const indexConfig: IndexConfig = Object.assign({
            version: 1,
            name: modelConfig.name,
            namespace: config.namespace,
            indexSchema: {
                version: modelConfig.version,
                mapping: addDefaultMapping(modelConfig.mapping),
            },
            dataSchema: {
                schema: addDefaultSchema(modelConfig.schema),
                strict: modelConfig.strictMode === false ? false : true,
                allFormatters: true,
            },
            indexSettings: {
                'index.number_of_shards': 5,
                'index.number_of_replicas': 1,
                analysis: {
                    analyzer: {
                        lowercase_keyword_analyzer: {
                            tokenizer: 'keyword',
                            filter: 'lowercase'
                        }
                    }
                }
            },
            ingestTimeField: 'created',
            eventTimeField: 'updated',
            logger: config.logger,
        }, config.storeOptions, modelConfig.storeOptions);

        this.name = utils.toInstanceName(modelConfig.name);
        this.store = new IndexStore(client, indexConfig);

        this._uniqueFields = ts.concat('id', modelConfig.uniqueFields);
        this._sanitizeFields = modelConfig.sanitizeFields || {};

        if (modelConfig.fixDoc) {
            this._fixDoc = modelConfig.fixDoc;
        }
    }

    async initialize() {
        return this.store.initialize();
    }

    async shutdown() {
        return this.store.shutdown();
    }

    async count(query: string): Promise<number> {
        return this.store.count(query);
    }

    async create(record: C): Promise<T> {
        const docInput: unknown = {
            ...record,
            id: await utils.makeId(),
            created: utils.makeISODate(),
            updated: utils.makeISODate(),
        };

        const doc = this._sanitizeRecord(docInput as T);

        await this._ensureUnique(doc);
        await this.store.indexWithId(doc, doc.id);

        // @ts-ignore
        return ts.DataEntity.make(doc);
    }

    async deleteById(id: string): Promise<void> {
        await this.store.remove(id);
    }

    async deleteAll(ids: string[]): Promise<void> {
        if (!ids || !ids.length) return;

        await Promise.all(ids.map((id) => {
            return this.deleteById(id);
        }));
    }

    async exists(id: string[]|string): Promise<boolean> {
        const ids = ts.castArray(id);
        if (!ids.length) return true;

        const idQuery = ids.join(' OR ');
        const count = await this.store.count(`id: (${idQuery})`);

        return count === ids.length;
    }

    async findBy(fields: FieldMap<T>, joinBy = 'AND') {
        const query = Object.entries(fields)
            .map(([field, val]) => {
                if (val == null) {
                    throw new ts.TSError(`Missing value for field "${field}"`, {
                        statusCode: 422
                    });
                }
                return `${field}:"${val}"`;
            })
            .join(` ${joinBy} `);

        const results = await this._find(query, 1);
        const record = ts.getFirst(results);
        if (record == null) {
            throw new ts.TSError(`Unable to find ${this.name} by '${query}'`, {
                statusCode: 404,
            });
        }

        return this._fixDoc(record);
    }

    async findById(id: string): Promise<T> {
        return this.store.get(id).then(this._fixDoc);
    }

    async findByAnyId(anyId: string) {
        const fields: FieldMap<T> = {};

        for (const field of this._uniqueFields) {
            fields[field] = anyId;
        }

        return this.findBy(fields, 'OR').then(this._fixDoc);
    }

    async findAll(ids: string[]) {
        return this.store.mget({ ids }).then((result) => {
            return result.map(this._fixDoc);
        });
    }

    async find(q: string = '*', size: number = 10, fields?: (keyof T)[], sort?: string) {
        return this._find(q, size, fields, sort);
    }

    async update(record: U|T) {
        const doc: T = this._fixDoc(this._sanitizeRecord({
            ...record,
            updated: utils.makeISODate(),
        } as T));

        if (!doc.id) {
            throw new ts.TSError('Updates required id', {
                statusCode: 422
            });
        }

        const existing = await this.store.get(doc.id);

        for (const field of this._uniqueFields) {
            if (field === 'id') continue;
            if (doc[field] == null) continue;

            if (existing[field] !== doc[field]) {
                const count = await this._countBy(field, doc[field]);

                if (count > 0) {
                    throw new ts.TSError(`Update requires ${field} to be unique`, {
                        statusCode: 409
                    });
                }
            }
        }

        await this.store.update({ doc }, doc.id, {
            refresh: true,
        });
    }

    async updateWith(id: string, body: any): Promise<void> {
        await this.store.update(body, id);
    }

    async appendToArray(id: string, field: keyof T, values: string[]|string): Promise<void> {
        if (!values || !values.length) return;

        await this.updateWith(id, {
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

    async removeFromArray(id: string, field: keyof T, values: string[]|string): Promise<void> {
        if (!values || !values.length) return;

        await this.updateWith(id, {
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
    }

    protected async _countBy(field: keyof T, val: any): Promise<number> {
        if (!val) return 0;
        return this.store.count(`${field}:"${val}"`);
    }

    protected async _find(q: string = '*', size: number = 10, fields?: (keyof T)[], sort?: string) {
        const results = await this.store.search(q, {
            size,
            sort,
            _source: fields,
        });

        return results.map(this._fixDoc);
    }

    protected async _ensureUnique(record: T) {
        for (const field of this._uniqueFields) {
            if (field === 'id') continue;
            if (record[field] == null) {
                throw new ts.TSError(`Create requires field ${field}`, {
                    statusCode: 422
                });
            }

            const count = await this._countBy(field, record[field]);
            if (count > 0) {
                throw new ts.TSError(`Create requires ${field} to be unique`, {
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
                    record[field] = utils.trim(record[field]);
                    break;
                case 'trimAndLower':
                    record[field] = utils.trimAndLower(record[field]);
                    break;
                default:
                    continue;
            }
        }

        return record;
    }
}

export interface ModelConfig<T extends BaseModel> {
    /** Schema Version */
    version: number;

    /** Name of the Model/Data Type */
    name: string;

    /** ElasticSearch Mapping */
    mapping: any;

    /** JSON Schema */
    schema: any;

    /** Additional IndexStore configuration */
    storeOptions?: Partial<IndexConfig>;

    /** Unqiue fields across on Index */
    uniqueFields?: (keyof T)[];

    /** Sanitize / cleanup fields mapping, like trim or trimAndToLower */
    sanitizeFields?: SanitizeFields;

    /** A custom function to fix any legacy data on the a record */
    fixDoc?: FixDocFn<T>;

    /** Specify whether the data should be strictly validated, defaults to true */
    strictMode?: boolean;
}

export type FixDocFn<T extends BaseModel> = (doc: T) => T;

export type FieldMap<T> = {
    [field in keyof T]?: string;
};

export type SanitizeFields = {
    [field: string]: 'trimAndLower'|'trim';
};

export type BaseConfig = ModelConfig<BaseModel> & ManagerConfig;

export interface BaseModel {
    /**
     * ID of the view - nanoid 12 digit
    */
    readonly id: string;

    /** Updated date */
    updated: string;

    /** Creation date */
    created: string;
}
