import type { RequestParams } from '@opensearch-project/opensearch';
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

    /**
     * Gets the number of matches for a search query or
     * if no query provided the count for docs in an index
     * @param CountParams
     * @returns { count: number }
    */

    async count(params: methods.CountParams): Promise<{ count: number }> {
        const parsedParams = methods.convertCountParams(params, this.distribution, this.version);
        const resp = await this.client.count(parsedParams);

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
     * Retrieves the specified JSON document from an index or an empty doc if no doc id is found
     * @param RequestParams.Get
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
     * Check that the document id exists in the specified index.
     * @param RequestParams.Get
     * @returns boolean
    */

    async exists(params: RequestParams.Get): Promise<boolean> {
        const resp = await this.client.exists(params);

        return this._removeBody(resp);
    }

    /**
     * Returns info about the cluster the client is connected to
     * @returns
    */
    async info() {
        const resp = await this.client.info();

        return this._removeBody(resp);
    }

    /**
     * Returns search hits that match the query defined in the request.
     * @param RequestParams.AsyncSearchSubmit
     * @returns array of docs that match search
     */

    async search(params: any) {
        const resp = await this.client.search(params);

        const body = this._removeBody(resp);

        return body.hits.hits.map((doc: any) => doc._source);
    }

    /**
     * Returns information about one or more indices
     * @param RequestParams.IndicesGet
     * @returns JSON of Index Mappings and Settings
     */

    private async _indicesGet(params: RequestParams.IndicesGet) {
        const resp = await this.client.indices.get(params);

        return this._removeBody(resp);
    }

    private async _indicesCreate(params: RequestParams.IndicesCreate) {
        const resp = await this.client.indices.create(params);

        return this._removeBody(resp);
    }

    private async _indicesDelete(params: RequestParams.IndicesDelete) {
        const resp = await this.client.indices.delete(params);

        return this._removeBody(resp);
    }

    private async _indicesExists(params: RequestParams.IndicesExists) {
        const resp = await this.client.indices.exists(params);

        return this._removeBody(resp);
    }

    private _removeBody(input: Record<string, any>): any {
        if (input.body == null) return input;
        return input.body;
    }

    /**
     * document related operations
        * bulk
        * count √
        * delete_by_query √
        * get √
        * exists √
        * info √
        * mget
        * msearch
        * ping √
        * search √
     * indices
       * create √
       * delete √
       * delete_template
       * exists √
       * exists_template
       * get √
       * get_field_mapping
       * get_index_template
       * get_mapping
       * get_settings
       * get_template
       * put_mapping
       * put_settings
       * put_template
     * tasks
       * cancel
       * get
       * list
    */
}
