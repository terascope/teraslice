import { ElasticsearchDistribution } from '@terascope/types';
import * as methods from './method-helpers';
import { Semver } from './interfaces';

export class WrappedClient {
    private client: any;
    private distribution: ElasticsearchDistribution;
    private version: Semver;

    constructor(
        client: any,
        distribution: ElasticsearchDistribution,
        version: Semver
    ) {
        this.client = client;
        this.distribution = distribution;
        this.version = version;
    }

    async bulk(params: methods.BulkParams): Promise<methods.BulkResponse> {
        const parsedParams = methods.convertBulkParams(params, this.distribution, this.version);
        const resp = this.client.bulk(parsedParams);

        return this._removeBody(resp);
    }

    /**
     * creates a new record, can throw if record already exists
     * @param CountParams
    */
    async create(params: methods.CreateParams): Promise<methods.CreateResponse> {
        const parsedParams = methods.convertCreateParams(params, this.distribution, this.version);
        const resp = await this.client.create(parsedParams);

        return this._removeBody(resp);
    }

    /**
     * indexes a new record
     * @param CountParams
    */
    async index(params: methods.IndexParams): Promise<methods.IndexResponse> {
        const parsedParams = methods.convertIndexParams(params, this.distribution, this.version);
        const resp = await this.client.index(parsedParams);

        return this._removeBody(resp);
    }

    /**
     * updates a record, or can upsert a record
     * @param CountParams
    */
    async update(params: methods.UpdateParams): Promise<methods.UpdateResponse> {
        const parsedParams = methods.convertUpdateParams(params, this.distribution, this.version);
        const resp = await this.client.update(parsedParams);

        return this._removeBody(resp);
    }

    /**
     * Gets the number of matches for a search query or
     * if no query provided the count for docs in an index
     * @param CountParams
    */

    async count(params: methods.CountParams): Promise<methods.CountResponse> {
        const parsedParams = methods.convertCountParams(params, this.distribution, this.version);
        const resp = await this.client.count(parsedParams);

        return this._removeBody(resp);
    }

    /**
     * Deletes a specific record, requires an index and id.
     * @param RequestParams.delete
    */

    async delete(params: methods.DeleteParams): Promise<methods.DeleteResponse> {
        const parsedParams = methods.convertDeleteParams(
            params, this.distribution, this.version
        );
        const resp = await this.client.delete(parsedParams);

        return this._removeBody(resp);
    }

    /**
     * Deletes documents that match the specified query.
     * @param RequestParams.DeleteByQuery
     * @returns count or Elasticsearch task_id
    */

    async deleteByQuery(
        params: methods.DeleteByQueryParams
    ): Promise<methods.DeleteByQueryResponse> {
        const parsedParams = methods.convertDeleteByQueryParams(
            params, this.distribution, this.version
        );
        const resp = await this.client.deleteByQuery(parsedParams);

        return this._removeBody(resp);
    }

    /**
     * Check that the document id exists in the specified index.
     * @param ExistsParams
     * @returns boolean
    */
    async exists(params: methods.ExistsParams): Promise<boolean> {
        const convertedParams = methods.convertExistsParams(
            params,
            this.distribution,
            this.version
        );

        const resp = await this.client.exists(convertedParams);

        return this._removeBody(resp);
    }

    /**
     * Retrieves the specified JSON document from an index or an empty doc if no doc id is found
     * @param methods.GetParams
     * @returns Object
    */

    async get(params: methods.GetParams): Promise<methods.GetQueryResponse> {
        const parsedParams = methods.convertGetParams(
            params, this.distribution, this.version
        );
        const response = await this.client.get(parsedParams);

        return this._removeBody(response);
    }

    /**
     * Returns info about the cluster the client is connected to
     * @returns object with cluster info
    */
    async info() {
        methods.validateDistribution(this.distribution, this.version);
        const resp = await this.client.info();

        return this._removeBody(resp);
    }

    /**
     * Returns true or false based on whether the cluster is running.
     * @returns Boolean
    */
    async ping() {
        methods.validateDistribution(this.distribution, this.version);
        const resp = await this.client.ping();
        return this._removeBody(resp);
    }

    /**
     * Returns search hits that match the query defined in the request.
     * @param SearchParams
     * @returns Array of Record<string, any>
     */

    async search(params: methods.SearchParams) {
        const parsedParams = methods.convertSearchParams(params, this.distribution, this.version);

        const resp = await this.client.search(parsedParams);

        return this._removeBody(resp);
    }

    /**
     * The multi search execution of several searches within the same API request
     * @param MSearchParams
     * @returns Array of Record<string, any>
     */

    async msearch(params: methods.MSearchParams) {
        const parsedParams = methods.convertMSearchParams(params, this.distribution, this.version);

        const resp = await this.client.msearch(parsedParams);

        return this._removeBody(resp);
    }

    /**
     * The multi get execution of multiple-get searches from a single API request
     * @param MGetParams
     * @returns Array of Record<string, any>
     */

    async mget(params: methods.MGetParams) {
        const parsedParams = methods.convertMGetParams(params, this.distribution, this.version);

        const resp = await this.client.mget(parsedParams);

        return this._removeBody(resp);
    }

    /**
     * Re-Index data to a new index
     * @param ReIndexParams
     * @returns Report of re-indexing task or task id if wait_for_completion is false
     */

    async reindex(params: methods.ReIndexParams) {
        const parsedParams = methods.convertReIndexParams(params, this.distribution, this.version);

        const resp = await this.client.reindex(parsedParams);

        return this._removeBody(resp);
    }

    private _removeBody(input: Record<string, any>): any {
        if (input.body == null) return input;
        return input.body;
    }
}
