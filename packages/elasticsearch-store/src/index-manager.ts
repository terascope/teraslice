import * as es from 'elasticsearch';
import { IndexConfig } from './interfaces';

/** Manage ElasticSearch Indicies */
export default class IndexManager {
    readonly client: es.Client;

    constructor(client: es.Client) {
        this.client = client;
    }

    /** Create a template */
    async createTemplate(name: string, version: string, template: any) {
        return;
    }

    /** Safely update an index */
    async updateTemplate(name: string, version: string, template: any) {
        return;
    }

    /**
     * Perform an Index Migration
     *
     * **IMPORTANT** This is a potentionally dangerous operation
     * and should only when the cluster is properly shutdown.
    */
    async migrateIndex(config: MigrateIndexConfig): Promise<void> {

    }

    /** Verify the index exists */
    async exists(params: es.IndicesExistsParams) {
        return;
    }

    /** Create an index */
    async create(params: es.IndicesCreateParams) {
        return;
    }

    /** Refresh an index */
    async refresh(params: es.IndicesRefreshParams) {
        return;
    }

    /** Index recovery */
    async recovery(params: es.IndicesRecoveryParams) {
        return;
    }
}

export interface MigrateIndexConfig {
    to: IndexConfig;
    from: IndexConfig;
    timeout: number;
}
