import * as es from 'elasticsearch';
import { IndexStore, IndexConfig } from 'elasticsearch-store';
import { Omit } from '@terascope/utils';
import { makeId, makeISODate } from '../utils';

/**
 * A base class for handling the different ACL models
*/
export class Base<T extends BaseModel> {
    readonly store: IndexStore<T>;

    constructor(client: es.Client, config: IndexConfig) {
        const indexConfig: IndexConfig = Object.assign({
            indexSettings: {
                'index.number_of_shards': 4,
                'index.number_of_replicas': 1
            },
            ingestTimeField: 'created',
            eventTimeField: 'updated',
        }, config);

        this.store = new IndexStore(client, indexConfig);
    }

    async initialize() {
        return this.store.initialize();
    }

    async shutdown() {
        return this.store.shutdown();
    }

    async create(record: CreateInput<T>): Promise<T> {
        const doc = Object.assign({}, record, {
            id: await makeId(),
            created: makeISODate(),
            updated: makeISODate(),
        }) as T;

        await this.store.create(doc);
        return doc;
    }

    async deleteById(id: string): Promise<void> {
        return;
    }

    async findById(id: string): Promise<T> {
        // @ts-ignore FIXME
        return {};
    }

    async findAll(ids: string[], space: string): Promise<T[]> {
        return [];
    }

    async search(query: string, limit: number = 10, fields?: (keyof T)[], sort?: string): Promise<T[]> {
        return [];
    }

    async update(user: UpdateInput<T>): Promise<void> {
        return;
    }
}

export interface BaseModel {
    /**
     * ID of the view - nanoid 12 digit
    */
    id: string;

    /** Updated date */
    updated: string;

    /** Creation date */
    created: string;
}

export type CreateInput<T extends BaseModel> = Omit<T, 'id'|'created'|'updated'>;
export type UpdateInput<T extends BaseModel> = Partial<Omit<T, 'created'|'updated'>>;
