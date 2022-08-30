import { ElasticsearchDistribution } from '@terascope/types';
import * as methods from './method-helpers';
import { InfoResponse } from './method-helpers/interfaces';
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

    get cluster() {
        const {
            distribution, version, client,
            _removeBody
        } = this;

        return {
            async getSettings(
                params: methods.ClusterGetSettingsParams = {}
            ): Promise<methods.ClusterGetSettingsResponse> {
                const parsedParams = methods.convertClusterSettingsParams(
                    params, distribution, version
                );

                const resp = await client.cluster.getSettings(parsedParams);

                return _removeBody(resp);
            },
            async health(
                params: methods.ClusterHealthParams = {}
            ): Promise<methods.ClusterHealthResponse> {
                const parsedParams = methods.convertClusterSettingsParams(
                    params, distribution, version
                );
                const resp = await client.cluster.health(parsedParams);

                return _removeBody(resp);
            }
        };
    }

    get cat() {
        const {
            distribution, version, client,
            _removeBody
        } = this;

        return {
            async indices(
                params: methods.CatIndicesParams = {}
            ): Promise<methods.CatIndicesResponse> {
                const parsedParams = methods.convertCatIndicesParams(
                    params, distribution, version
                );
                const resp = await client.cat.indices(parsedParams);

                return _removeBody(resp);
            }
        };
    }

    get nodes() {
        const {
            distribution, version, client,
            _removeBody
        } = this;

        return {
            async stats(
                params: methods.NodesStatsParams = {}
            ): Promise<methods.NodesStatsResponse> {
                const parsedParams = methods.convertNodesStatsParams(
                    params, distribution, version
                );
                const resp = await client.nodes.stats(parsedParams);

                return _removeBody(resp);
            },
            async info(params: methods.NodesInfoParams = {}): Promise<methods.NodeInfoResponse> {
                const parsedParams = methods.convertNodeInfoParams(
                    params, distribution, version
                );
                const resp = await client.nodes.info(parsedParams);

                return _removeBody(resp);
            }
        };
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

    async get<T = Record<string, unknown>>(
        params: methods.GetParams
    ): Promise<methods.GetQueryResponse<T>> {
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
    async info(): Promise<InfoResponse> {
        methods.validateDistribution(this.distribution, this.version);
        const resp = await this.client.info();

        return this._removeBody(resp);
    }

    /**
     * Returns true or false based on whether the cluster is running.
     * @returns Boolean
    */
    async ping(): Promise<boolean> {
        methods.validateDistribution(this.distribution, this.version);
        const resp = await this.client.ping();
        return this._removeBody(resp);
    }

    /**
     * Returns search hits that match the query defined in the request.
     * @param SearchParams
     * @returns Array of Record<string, any>
     */

    async search(params: methods.SearchParams): Promise<methods.SearchResponse> {
        const parsedParams = methods.convertSearchParams(params, this.distribution, this.version);

        const resp = await this.client.search(parsedParams);

        return this._removeBody(resp);
    }

    /**
     * The multi search execution of several searches within the same API request
     * @param MSearchParams
     * @returns Array of Record<string, any>
     */

    async msearch(params: methods.MSearchParams): Promise<methods.MSearchResponse> {
        const parsedParams = methods.convertMSearchParams(params, this.distribution, this.version);

        const resp = await this.client.msearch(parsedParams);

        return this._removeBody(resp);
    }

    /**
     * The multi get execution of multiple-get searches from a single API request
     * @param MGetParams
     * @returns Array of Record<string, any>
     */

    async mget(params: methods.MGetParams): Promise<methods.MGetResponse> {
        const parsedParams = methods.convertMGetParams(params, this.distribution, this.version);

        const resp = await this.client.mget(parsedParams);

        return this._removeBody(resp);
    }

    /**
     * Re-Index data to a new index
     * @param ReIndexParams
     * @returns Report of re-indexing task or task id if wait_for_completion is false
    */
    async reindex(params: methods.ReIndexParams): Promise<methods.ReindexResponse> {
        const parsedParams = methods.convertReIndexParams(params, this.distribution, this.version);

        const resp = await this.client.reindex(parsedParams);

        return this._removeBody(resp);
    }

    get indices() {
        const {
            distribution,
            version,
            client,
            _removeBody
        } = this;

        return {
            /**
             * Creates a new index.
             * @param IndicesCreateParams
             * @returns IndicesCreateResponse
             */
            async create(params: methods.IndicesCreateParams):
            Promise<methods.IndicesCreateResponse> {
                const parsedParams = methods.convertIndicesCreateParams(
                    params,
                    distribution,
                    version
                );

                const resp = await client.indices.create(parsedParams);

                return _removeBody(resp);
            },
            /**
             * Deletes one or more indices.
             * @param IndicesDeleteParams
             * @returns
             */
            async delete(params: methods.IndicesDeleteParams):
            Promise<methods.IndicesDeleteResponse> {
                const parsedParams = methods.convertIndicesDeleteParams(
                    params,
                    distribution,
                    version
                );

                const resp = await client.indices.delete(parsedParams);

                return _removeBody(resp);
            },
            /**
             * Checks if a data stream, index, or alias exists.
             * @param IndicesExistsParams
             * @returns boolean
             */
            async exists(params: methods.IndicesExistsParams): Promise<boolean> {
                const parsedParams = methods.convertIndicesExistsParams(
                    params,
                    distribution,
                    version
                );

                const resp = await client.indices.exists(parsedParams);

                return _removeBody(resp);
            },
            /**
             * Returns information about one or more indices
             * @param IndicesGetParams
             * @returns
            */
            async get(params: methods.IndicesGetParams): Promise<methods.IndicesGetResponse> {
                const parsedParams = methods.convertIndicesGetParams(params, distribution, version);

                const resp = await client.indices.get(parsedParams);

                return _removeBody(resp);
            },
            /**
             * Uploads index mapping template
             * @param IndicesPutTemplateParams
             * @returns IndicesPutTemplateResponse
             */
            async putTemplate(params: methods.IndicesPutTemplateParams):
            Promise<methods.IndicesPutTemplateResponse> {
                const parsedParams = methods.convertIndicesPutTemplateParams(
                    params,
                    distribution,
                    version
                );

                const resp = await client.indices.putTemplate(parsedParams);

                return _removeBody(resp);
            },
            /**
             * Deletes index templates
             * @param IndicesDeleteTemplateParams
             * @returns IndicesDeleteTemplateResponse
            */
            async deleteTemplate(params: methods.IndicesDeleteTemplateParams):
            Promise<methods.IndicesDeleteTemplateResponse> {
                const parsedParams = methods.convertIndicesDeleteTemplateParams(
                    params,
                    distribution,
                    version
                );

                const resp = await client.indices.deleteTemplate(parsedParams);

                return _removeBody(resp);
            },
            /**
             * Returns true if template exists
             * @param IndicesExistsTemplateParams
             * @returns boolean
             */
            async existsTemplate(params: methods.IndicesExistsTemplateParams):
            Promise<boolean> {
                const parsedParams = methods.convertIndicesExistsTemplateParams(
                    params,
                    distribution,
                    version
                );

                const resp = await client.indices.existsTemplate(parsedParams);

                return _removeBody(resp);
            },
            /**
             * Returns template
             * @param IndicesGetTemplateParams
             * @returns template
            */
            async getTemplate(params: methods.IndicesGetTemplateParams):
            Promise<methods.IndicesGetTemplateResponse> {
                const parsedParams = methods.convertIndicesGetTemplateParams(
                    params,
                    distribution,
                    version
                );

                const resp = await client.indices.getTemplate(parsedParams);

                return _removeBody(resp);
            },
            /**
             * Returns index template
             * @params IndicesGetIndexTemplateParams
             * @returns IndicesGetIndexTemplateResponse
             * not supported by elasticsearch version 6
             */
            async getIndexTemplate(params: methods.IndicesGetTemplateParams):
            Promise<methods.IndicesGetIndexTemplateResponse> {
                const parsedParams = methods.convertIndicesGetTemplateParams(
                    params,
                    distribution,
                    version
                );

                const resp = await client.indices.getIndexTemplate(parsedParams);

                return _removeBody(resp);
            },

            async getMapping(
                params: methods.IndicesGetMappingParams
            ): Promise<methods.IndicesGetMappingResponse> {
                const parsedParams = methods.convertIndicesGetMappingParams(
                    params,
                    distribution,
                    version
                );
                const resp = await client.indices.getMapping(parsedParams);

                return _removeBody(resp);
            },

            async putMapping(
                params: methods.IndicesPutMappingParams
            ): Promise< methods.IndicesPutMappingResponse> {
                const parsedParams = methods.convertIndicesPutMappingParams(
                    params,
                    distribution,
                    version
                );
                const resp = await client.indices.putMapping(parsedParams);

                return _removeBody(resp);
            },

            async getFieldMapping(params: methods.IndicesGetFieldMappingParams
            ): Promise<methods.IndicesGetFieldMappingResponse> {
                const parsedParams = methods.convertIndicesGetFieldMappingParams(
                    params,
                    distribution,
                    version
                );
                const resp = await client.indices.getSettings(parsedParams);

                return _removeBody(resp);
            },

            async getSettings(
                params: methods.IndicesGetSettingsParams
            ): Promise<methods.IndicesGetSettingsResponse> {
                const parsedParams = methods.convertIndicesGetSettingsParams(
                    params,
                    distribution,
                    version
                );
                const resp = await client.indices.getSettings(parsedParams);

                return _removeBody(resp);
            },

            async putSettings(
                params: methods.IndicesPutSettingsParams
            ): Promise<methods.IndicesPutSettingsResponse> {
                const parsedParams = methods.convertIndicesPutSettingsParams(
                    params,
                    distribution,
                    version
                );
                const resp = await client.indices.putSettings(parsedParams);

                return _removeBody(resp);
            },

            // TODO: can this be an empty query?
            async refresh(
                params: methods.IndicesRefreshParams
            ): Promise<methods.IndicesRefreshResponse> {
                const parsedParams = methods.convertIndicesRefreshParams(
                    params,
                    distribution,
                    version
                );
                const resp = await client.indices.refresh(parsedParams);

                return _removeBody(resp);
            },

            // TODO: can this be an empty query?
            async recovery(
                params: methods.IndicesRecoveryParams
            ): Promise<methods.IndicesRecoveryResponse> {
                const parsedParams = methods.convertIndicesRecoveryParams(
                    params,
                    distribution,
                    version
                );

                const resp = await client.indices.recovery(parsedParams);

                return _removeBody(resp);
            },

            async validateQuery(
                params: methods.IndicesValidateQueryParams
            ): Promise<methods.IndicesValidateQueryResponse> {
                const parsedParams = methods.convertIndicesValidateQueryPParams(
                    params,
                    distribution,
                    version
                );

                const resp = await client.indices.validateQuery(parsedParams);

                return _removeBody(resp);
            },
        };
    }

    get tasks() {
        const {
            distribution,
            version,
            client,
            _removeBody
        } = this;

        return {
            /**
             * Cancels a currently running task
             * @param TasksCancelParams
             * @returns TasksCancelResponse
            */
            async cancel(params: methods.TasksCancelParams): Promise<methods.TasksCancelResponse> {
                const parsedParams = methods.convertTasksCancelParams(
                    params,
                    distribution,
                    version
                );

                const resp = await client.tasks.cancel(parsedParams);

                return _removeBody(resp);
            },
            /**
             * Gets information about a running task
             * @param TasksGetParams
             * @returns TasksGetResponse
            */
            async get(params: methods.TasksGetParams): Promise<methods.TasksGetResponse> {
                const parsedParams = methods.convertTasksGetParams(
                    params,
                    distribution,
                    version
                );

                const resp = await client.tasks.get(parsedParams);

                return _removeBody(resp);
            },
            /**
             * Returns information about the tasks currently executing in the cluster.
             * @param TasksListParams
             * @returns
             */
            async list(params: methods.TasksListParams): Promise<methods.TasksListResponse> {
                const parsedParams = methods.convertTasksListParams(
                    params,
                    distribution,
                    version
                );

                const resp = await client.tasks.list(parsedParams);

                return _removeBody(resp);
            }
        };
    }

    private _removeBody(input: Record<string, any>): any {
        if (input.body == null) return input;
        return input.body;
    }
}
