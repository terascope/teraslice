import * as es from 'elasticsearch';
import { Omit, DataEntity, concat, getFirst, TSError } from '@terascope/utils';
import { IndexStore, IndexConfig } from 'elasticsearch-store';
import { addDefaultMapping, addDefaultSchema } from './config/base';
import { makeId, makeISODate } from '../utils';
import { ManagerConfig } from '../interfaces';

/**
 * A base class for handling the different ACL models
*/
export class Base<T extends BaseModel> {
    readonly store: IndexStore<T>;
    readonly name: string;
    private _uniqueFields: string[];

    constructor(client: es.Client, config: ManagerConfig, modelConfig: ModelConfig) {
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
                strict: true,
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
        }, config.storeOptions, modelConfig.storeOptions);

        this.name = modelConfig.name;
        this.store = new IndexStore(client, indexConfig);

        this._uniqueFields = concat(['id'], modelConfig.uniqueFields);
    }

    async initialize() {
        return this.store.initialize();
    }

    async shutdown() {
        return this.store.shutdown();
    }

    async create(record: CreateInput<T>|DataEntity<CreateInput<T>>): Promise<T> {

        const doc = Object.assign({}, record, {
            id: await makeId(),
            created: makeISODate(),
            updated: makeISODate(),
        }) as T;

        await this._ensureUnique(doc);
        await this.store.indexWithId(doc, doc.id);
        return doc;
    }

    async deleteById(id: string): Promise<void> {
        await this.store.remove(id);
    }

    async findById(id: string) {
        return this.store.get(id);
    }

    async findByAnyId(anyId: string) {
        const query = this._uniqueFields
            .map((field) => `${field}:"${anyId}"`)
            .join(' OR ');

        const result = await this.find(query, 1);

        const record = getFirst(result);
        if (record == null) {
            throw new TSError(`Unable to find "${this.name}" by "${anyId}"`, {
                statusCode: 404,
            });
        }

        return record;
    }

    async findAll(ids: string[]) {
        return this.store.mget({ ids });
    }

    async find(q: string, size: number = 10, fields?: (keyof T)[], sort?: string) {
        return this.store.search({
            q,
            size,
            sort,
            _source: fields,
        });
    }

    async update(record: UpdateInput<T>|DataEntity<UpdateInput<T>>) {
        const doc = Object.assign({}, record, {
            updated: makeISODate(),
        }) as T;

        const existing = await this.store.get(doc.id);

        for (const field of this._uniqueFields) {
            if (field === 'id') continue;
            if (doc[field] == null) continue;

            if (existing[field] !== doc[field]) {
                const count = await this._countBy(field, doc[field]);

                if (count > 0) {
                    throw new TSError(`Update requires ${field} to be unique`, {
                        statusCode: 409
                    });
                }
            }
        }

        return this.store.update(doc, doc.id);
    }

    private async _countBy(field: string, val: string): Promise<number> {
        return this.store.count(`${field}:"${val}"`);
    }

    private async _ensureUnique(record: T) {
        for (const field of this._uniqueFields) {
            if (field === 'id') continue;
            if (record[field] == null) {
                throw new TSError(`Create requires field ${field}`, {
                    statusCode: 422
                });
            }

            const count = await this._countBy(field, record[field]);
            if (count > 0) {
                throw new TSError(`Create requires ${field} to be unique`, {
                    statusCode: 409
                });
            }
        }

        return;
    }
}

export interface ModelConfig {
    name: string;
    mapping: any;
    schema: any;
    version: number;
    storeOptions?: Partial<IndexConfig>;
    uniqueFields?: string[];
}

export type BaseConfig = ModelConfig & ManagerConfig;

export type CreateInput<T extends BaseModel> = Omit<T, 'id'|'created'|'updated'>;
export type UpdateInput<T extends BaseModel> = Partial<Omit<T, 'created'|'updated'>>;

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
