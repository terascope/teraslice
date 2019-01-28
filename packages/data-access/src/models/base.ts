import * as es from 'elasticsearch';
import { Omit, DataEntity } from '@terascope/utils';
import { IndexStore, IndexConfig } from 'elasticsearch-store';
import { addDefaultMapping, addDefaultSchema } from './config/base';
import { makeId, makeISODate } from '../utils';
import { ManagerConfig } from '../interfaces';

/**
 * A base class for handling the different ACL models
*/
export class Base<T extends BaseModel> {
    readonly store: IndexStore<T>;

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
        }, config.storeOptions, modelConfig);

        this.store = new IndexStore(client, indexConfig);
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

        await this.store.indexWithId(doc, doc.id);
        return doc;
    }

    async deleteById(id: string): Promise<void> {
        await this.store.remove(id);
    }

    async findById(id: string) {
        return this.store.get(id);
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

        return this.store.update(doc, doc.id);
    }
}

export interface ModelConfig {
    name: string;
    mapping: any;
    schema: any;
    version: number;
    storeOptions?: Partial<IndexConfig>;
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
