import { ElasticsearchDistribution } from '@terascope/types';
import type { ExistsParams } from './method-helpers/exists';
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
     * @param ExistsParams
     * @returns boolean
    */
    async exists(params: ExistsParams): Promise<boolean> {
        const convertedParams = methods.convertExistsParams(
            params,
            this.distribution,
            this.version
        );

        const resp = await this.client.exists(convertedParams);

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

    private _removeBody(input: Record<string, any>): any {
        if (input.body == null) return input;
        return input.body;
    }
}
