import * as es from 'elasticsearch';
import { Omit } from '@terascope/utils';

/**
 * A base class for handling the different ACL models
*/
export class ModelFactory<T extends BaseModel> {
    constructor(client: es.Client) {

    }

    async initialize(): Promise<void> {
        return;
    }

    async shutdown(): Promise<void> {
        return;
    }

    async create(user: CreateInput<T>): Promise<void> {
        return;
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
     * ID of the view - nanoid 10 digit
    */
    id: string;

    /** Updated date */
    updated: Date;

    /** Creation date */
    created: Date;
}

export type CreateInput<T extends BaseModel> = Omit<T, 'id'|'created'|'updated'>;
export type UpdateInput<T extends BaseModel> = Partial<Omit<T, 'created'|'updated'>>;
