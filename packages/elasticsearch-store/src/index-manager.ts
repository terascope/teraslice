import * as es from 'elasticsearch';

/** Manage ElasticSearch Indicies */
export default class IndexManager {
    readonly client: es.Client;

    constructor(client: es.Client) {
        this.client = client;
    }

    /** Create a template */
    async createTemplate(name: string, template: any) {
        return;
    }

    /** Safely update an index */
    async updateTemplate(name: string, template: any) {
        return;
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
