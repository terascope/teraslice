import { ClientParams, ClientResponse, ClientMetadata } from '@terascope/types';
import * as methods from './method-helpers/index.js';

export class Client {
    private client: any;
    private distributionMeta: ClientMetadata;

    constructor(
        client: any,
        distributionMeta: ClientMetadata,
    ) {
        this.client = client;
        this.distributionMeta = distributionMeta;
    }

    get __meta() {
        return this.distributionMeta;
    }

    async bulk(
        params: ClientParams.BulkParams
    ): Promise<ClientResponse.BulkResponse> {
        const parsedParams = methods.convertBulkParams(
            params,
            this.distributionMeta
        );

        const resp = await this.client.bulk(parsedParams);

        return this._removeBody(resp);
    }

    /**
     * creates a new record, can throw if record already exists
     * @param CountParams
    */
    async create(
        params: ClientParams.CreateParams
    ): Promise<ClientResponse.CreateResponse> {
        const parsedParams = methods.convertCreateParams(
            params as ClientParams.CreateParams,
            this.distributionMeta
        );

        const resp = await this.client.create(parsedParams);

        return this._removeBody(resp);
    }

    /**
     * indexes a new record
     * @param CountParams
    */
    async index(
        params: ClientParams.IndexParams
    ): Promise<ClientResponse.IndexResponse> {
        const parsedParams = methods.convertIndexParams(
            params as ClientParams.IndexParams,
            this.distributionMeta
        );

        const resp = await this.client.index(parsedParams);

        return this._removeBody(resp);
    }

    /**
     * updates a record, or can upsert a record
     * @param CountParams
    */
    async update(
        params: ClientParams.UpdateParams
    ): Promise<ClientResponse.UpdateResponse> {
        const parsedParams = methods.convertUpdateParams(
            params as ClientParams.UpdateParams,
            this.distributionMeta
        );

        const resp = await this.client.update(parsedParams);

        return this._removeBody(resp);
    }

    /**
     * Gets the number of matches for a search query or
     * if no query provided the count for docs in an index
     * @param CountParams
    */

    async count(
        params: ClientParams.CountParams
    ): Promise<ClientResponse.CountResponse> {
        const parsedParams = methods.convertCountParams(
            params as ClientParams.CountParams,
            this.distributionMeta
        );

        const resp = await this.client.count(parsedParams);

        return this._removeBody(resp);
    }

    get cluster() {
        const {
            distributionMeta,
            client,
            _removeBody
        } = this;

        return {
            async getSettings(
                params: ClientParams.ClusterGetSettingsParams = {}
            ): Promise<ClientResponse.ClusterGetSettingsResponse> {
                const parsedParams = methods.convertClusterSettingsParams(
                    params,
                    distributionMeta
                );

                const resp = await client.cluster.getSettings(parsedParams);

                return _removeBody(resp);
            },
            async health(
                params: ClientParams.ClusterHealthParams = {}
            ): Promise<ClientResponse.ClusterHealthResponse> {
                const parsedParams = methods.convertClusterSettingsParams(
                    params,
                    distributionMeta
                );
                const resp = await client.cluster.health(parsedParams);

                return _removeBody(resp);
            }
        };
    }

    get cat() {
        const {
            distributionMeta,
            client,
            _removeBody
        } = this;

        return {
            async indices(
                params: ClientParams.CatIndicesParams = {}
            ): Promise<ClientResponse.CatIndicesResponse> {
                const parsedParams = methods.convertCatIndicesParams(
                    params,
                    distributionMeta
                );

                const resp = await client.cat.indices(parsedParams);

                return _removeBody(resp);
            }
        };
    }

    get nodes() {
        const {
            distributionMeta,
            client,
            _removeBody
        } = this;

        return {
            async stats(
                params: ClientParams.NodesStatsParams = {}
            ): Promise<ClientResponse.NodesStatsResponse> {
                const parsedParams = methods.convertNodesStatsParams(
                    params,
                    distributionMeta
                );

                const resp = await client.nodes.stats(parsedParams);

                return _removeBody(resp);
            },
            async info(
                params: ClientParams.NodesInfoParams = {}
            ): Promise<ClientResponse.NodesInfoResponse> {
                const parsedParams = methods.convertNodeInfoParams(
                    params,
                    distributionMeta
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
    async delete(
        params: ClientParams.DeleteParams
    ): Promise<ClientResponse.DeleteResponse> {
        const parsedParams = methods.convertDeleteParams(
            params,
            this.distributionMeta
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
        params: ClientParams.DeleteByQueryParams
    ): Promise<ClientResponse.DeleteByQueryResponse> {
        const parsedParams = methods.convertDeleteByQueryParams(
            params,
            this.distributionMeta
        );

        const resp = await this.client.deleteByQuery(parsedParams);

        return this._removeBody(resp);
    }

    /**
     * Check that the document id exists in the specified index.
     * @param ExistsParams
     * @returns boolean
    */
    async exists(
        params: ClientParams.ExistsParams
    ): Promise<ClientResponse.ExistsResponse> {
        const convertedParams = methods.convertExistsParams(
            params as ClientParams.ExistsParams,
            this.distributionMeta
        );

        const resp = await this.client.exists(convertedParams);

        return this._removeBody(resp);
    }

    /**
     * Retrieves the specified JSON document from an index or an empty doc if no doc id is found
     * @param ClientParams.GetParams
     * @returns Object
    */
    async get<T = Record<string, unknown>>(
        params: ClientParams.GetParams
    ): Promise<ClientResponse.GetResponse<T>> {
        const parsedParams = methods.convertGetParams(
            params as ClientParams.GetParams,
            this.distributionMeta
        );

        const response = await this.client.get(parsedParams);

        return this._removeBody(response);
    }

    /**
     * Returns info about the cluster the client is connected to
     * @returns object with cluster info
    */
    async info(): Promise<ClientResponse.InfoResponse> {
        methods.validateDistribution(this.distributionMeta);

        const resp = await this.client.info();

        return this._removeBody(resp);
    }

    /**
     * Returns true or false based on whether the cluster is running.
     * @returns Boolean
    */
    async ping(): Promise<boolean> {
        methods.validateDistribution(this.distributionMeta);

        const resp = await this.client.ping();

        return this._removeBody(resp);
    }

    /**
     * Returns search hits that match the query defined in the request.
     * @param SearchParams
     * @returns {Record<string,any>[]}
    */
    async search<T = Record<string, unknown>>(
        params: ClientParams.SearchParams
    ): Promise<ClientResponse.SearchResponse<T>> {
        const parsedParams = methods.convertSearchParams(
            params as ClientParams.SearchParams,
            this.distributionMeta
        );

        const resp = await this.client.search(parsedParams);

        return this._removeBody(resp);
    }

    /**
     * The multi search execution of several searches within the same API request
     * @param MSearchParams
     * @returns {Record<string,any>[]}
    */
    async msearch(
        params: ClientParams.MSearchParams
    ): Promise<ClientResponse.MSearchResponse> {
        const parsedParams = methods.convertMSearchParams(
            params as ClientParams.MSearchParams,
            this.distributionMeta
        );

        const resp = await this.client.msearch(parsedParams);

        return this._removeBody(resp);
    }

    /**
     * The multi get execution of multiple-get searches from a single API request
     * @param MGetParams
     * @returns {Record<string,any>[]}
    */
    async mget(
        params: ClientParams.MGetParams
    ): Promise<ClientResponse.MGetResponse> {
        const parsedParams = methods.convertMGetParams(
            params as ClientParams.MGetParams,
            this.distributionMeta
        );

        const resp = await this.client.mget(parsedParams);

        return this._removeBody(resp);
    }

    /**
     * Re-Index data to a new index
     * @param ReIndexParams
     * @returns Report of re-indexing task or task id if wait_for_completion is false
    */
    async reindex(
        params: ClientParams.ReindexParams
    ): Promise<ClientResponse.ReindexResponse> {
        const parsedParams = methods.convertReIndexParams(
            params as ClientParams.ReindexParams,
            this.distributionMeta
        );

        const resp = await this.client.reindex(parsedParams);

        return this._removeBody(resp);
    }

    get indices() {
        const {
            distributionMeta,
            client,
            _removeBody
        } = this;

        return {
            /**
             * Creates a new index.
             * @param IndicesCreateParams
             * @returns IndicesCreateResponse
             */
            async create(params: ClientParams.IndicesCreateParams):
            Promise<ClientResponse.IndicesCreateResponse> {
                const parsedParams = methods.convertIndicesCreateParams(
                    params as ClientParams.IndicesCreateParams,
                    distributionMeta
                );

                const resp = await client.indices.create(parsedParams);
                return _removeBody(resp);
            },
            /**
             * Deletes one or more indices.
             * @param IndicesDeleteParams
             * @returns
             */
            async delete(params: ClientParams.IndicesDeleteParams):
            Promise<ClientResponse.IndicesDeleteResponse> {
                const parsedParams = methods.convertIndicesDeleteParams(
                    params as ClientParams.IndicesDeleteParams,
                    distributionMeta
                );

                const resp = await client.indices.delete(parsedParams);

                return _removeBody(resp);
            },
            /**
             * Checks if a data stream, index, or alias exists.
             * @param IndicesExistsParams
             * @returns boolean
             */
            async exists(
                params: ClientParams.IndicesExistsParams
            ): Promise<ClientResponse.IndicesExistsResponse> {
                const parsedParams = methods.convertIndicesExistsParams(
                    params as ClientParams.IndicesExistsParams,
                    distributionMeta
                );

                const resp = await client.indices.exists(parsedParams);

                return _removeBody(resp);
            },
            /**
             * Returns information about one or more indices
             * @param IndicesGetParams
             * @returns
            */
            async get(
                params: ClientParams.IndicesGetParams
            ): Promise<ClientResponse.IndicesGetResponse> {
                const parsedParams = methods.convertIndicesGetParams(
                    params as ClientParams.IndicesGetParams,
                    distributionMeta
                );

                const resp = await client.indices.get(parsedParams);

                return _removeBody(resp);
            },
            /**
             * Uploads index mapping template
             * @param IndicesPutTemplateParams
             * @returns IndicesPutTemplateResponse
            */
            async putTemplate(
                params: ClientParams.IndicesPutTemplateParams
            ): Promise<ClientResponse.IndicesPutTemplateResponse> {
                const parsedParams = methods.convertIndicesPutTemplateParams(
                    params as ClientParams.IndicesPutTemplateParams,
                    distributionMeta
                );

                const resp = await client.indices.putTemplate(parsedParams);

                return _removeBody(resp);
            },
            /**
             * Deletes index templates
             * @param IndicesDeleteTemplateParams
             * @returns IndicesDeleteTemplateResponse
            */
            async deleteTemplate(
                params: ClientParams.IndicesDeleteTemplateParams
            ): Promise<ClientResponse.IndicesDeleteTemplateResponse> {
                const parsedParams = methods.convertIndicesDeleteTemplateParams(
                    params as ClientParams.IndicesDeleteTemplateParams,
                    distributionMeta
                );

                const resp = await client.indices.deleteTemplate(parsedParams);

                return _removeBody(resp);
            },
            /**
             * Returns true if template exists
             * @param IndicesExistsTemplateParams
             * @returns boolean
             */
            async existsTemplate(
                params: ClientParams.IndicesExistsTemplateParams
            ): Promise<ClientResponse.IndicesExistsTemplateResponse> {
                const parsedParams = methods.convertIndicesExistsTemplateParams(
                    params as ClientParams.IndicesExistsTemplateParams,
                    distributionMeta,
                );

                const resp = await client.indices.existsTemplate(parsedParams);

                return _removeBody(resp);
            },
            /**
             * Returns template
             * @param IndicesGetTemplateParams
             * @returns template
            */
            async getTemplate(
                params: ClientParams.IndicesGetTemplateParams
            ): Promise<ClientResponse.IndicesGetTemplateResponse> {
                const parsedParams = methods.convertIndicesGetTemplateParams(
                    params as ClientParams.IndicesGetTemplateParams,
                    distributionMeta
                );

                const resp = await client.indices.getTemplate(parsedParams);

                return _removeBody(resp);
            },
            /**
             * Returns index template
             * @param IndicesGetIndexTemplateParams
             * @returns IndicesGetIndexTemplateResponse
             * not supported by elasticsearch version 6
             * same params as IndicesGetTemplateParams
            */
            async getIndexTemplate(
                params: ClientParams.IndicesGetIndexTemplateParams
            ): Promise<ClientResponse.IndicesGetIndexTemplateResponse> {
                const parsedParams = methods.convertIndicesGetIndexTemplateParams(
                    params as ClientParams.IndicesGetIndexTemplateParams,
                    distributionMeta
                );

                const resp = await client.indices.getIndexTemplate(parsedParams);

                return _removeBody(resp);
            },

            /**
             * Retrieves mapping definitions for one or more indices
             * @param IndicesGetMappingParams
             * @returns IndicesGetMappingResponse
            */
            async getMapping(
                params: ClientParams.IndicesGetMappingParams
            ): Promise<ClientResponse.IndicesGetMappingResponse> {
                const parsedParams = methods.convertIndicesGetMappingParams(
                    params,
                    distributionMeta
                );

                const resp = await client.indices.getMapping(parsedParams);

                return _removeBody(resp);
            },

            /**
             * Adds new fields to an existing index or edit the search settings of existing fields.
             * @param IndicesPutMappingParams
             * @returns IndicesPutMappingResponse
            */
            async putMapping(
                params: ClientParams.IndicesPutMappingParams
            ): Promise<ClientResponse.IndicesPutMappingResponse> {
                const parsedParams = methods.convertIndicesPutMappingParams(
                    params as ClientParams.IndicesPutMappingParams,
                    distributionMeta
                );

                const resp = await client.indices.putMapping(parsedParams);

                return _removeBody(resp);
            },

            /**
             * Retrieves mapping definitions for one or more fields.
             * @param IndicesGetFieldMappingParams
             * @response IndicesGetFieldMappingResponse
            */
            async getFieldMapping(
                params: ClientParams.IndicesGetFieldMappingParams
            ): Promise<ClientResponse.IndicesGetFieldMappingResponse> {
                const parsedParams = methods.convertIndicesGetFieldMappingParams(
                    params as ClientParams.IndicesGetFieldMappingParams,
                    distributionMeta
                );

                const resp = await client.indices.getFieldMapping(parsedParams);

                return _removeBody(resp);
            },

            /**
             * Returns setting information for one or more indices
             * @param IndicesGetSettingsParams
             * @returns IndicesGetSettingsResponse
             */
            async getSettings(
                params: ClientParams.IndicesGetSettingsParams = {}
            ): Promise<ClientResponse.IndicesGetSettingsResponse> {
                const parsedParams = methods.convertIndicesGetSettingsParams(
                    params as ClientParams.IndicesGetSettingsParams,
                    distributionMeta,
                );

                const resp = await client.indices.getSettings(parsedParams);

                return _removeBody(resp);
            },

            /**
             * Changes a dynamic index setting in real time.
             * @param IndicesPutSettingsParams
             * @returns IndicesPutSettingsResponse
            */
            async putSettings(
                params: ClientParams.IndicesPutSettingsParams
            ): Promise<ClientResponse.IndicesPutSettingsResponse> {
                const parsedParams = methods.convertIndicesPutSettingsParams(
                    params as ClientParams.IndicesPutSettingsParams,
                    distributionMeta
                );

                const resp = await client.indices.putSettings(parsedParams);

                return _removeBody(resp);
            },

            /**
             * Makes a recent operation performed on one or more indices available for search.
             * @param IndicesRefreshParams
             * @returns IndicesRefreshResponse
             * can be an empty query
            */
            async refresh(
                params: ClientParams.IndicesRefreshParams = {}
            ): Promise<ClientResponse.IndicesRefreshResponse> {
                const parsedParams = methods.convertIndicesRefreshParams(
                    params as ClientParams.IndicesRefreshParams,
                    distributionMeta
                );

                const resp = await client.indices.refresh(parsedParams);

                return _removeBody(resp);
            },

            /**
             * Returns information about shard recoveries for one or more indices
             * @param IndicesRecoveryParams
             * @returns IndicesRecoveryResponse
             * can be an empty query
            */
            async recovery(
                params: ClientParams.IndicesRecoveryParams = {}
            ): Promise<ClientResponse.IndicesRecoveryResponse> {
                const parsedParams = methods.convertIndicesRecoveryParams(
                    params as ClientParams.IndicesRecoveryParams,
                    distributionMeta
                );

                const resp = await client.indices.recovery(parsedParams);

                return _removeBody(resp);
            },

            /**
             * Validates a query without executing it.
             * @param IndicesValidateQueryParams
             * @returns IndicesValidateQueryResponse
            */
            async validateQuery(
                params: ClientParams.IndicesValidateQueryParams
            ): Promise<ClientResponse.IndicesValidateQueryResponse> {
                const parsedParams = methods.convertIndicesValidateQueryParams(
                    params as ClientParams.IndicesValidateQueryParams,
                    distributionMeta
                );

                const resp = await client.indices.validateQuery(parsedParams);

                return _removeBody(resp);
            },

            /**
             * Returns statistics for one or more indices
             * @param IndicesStatsParams
             * @returns IndicesStatsResponse
            */
            async stats(
                params: ClientParams.IndicesStats
            ): Promise<ClientResponse.IndicesStatsResponse> {
                const parsedParams = methods.convertIndicesStatsParams(
                    params as ClientParams.IndicesStats,
                    distributionMeta
                );

                const resp = await client.indices.stats(parsedParams);
                return _removeBody(resp);
            }
        };
    }

    get tasks() {
        const {
            distributionMeta,
            client,
            _removeBody,

        } = this;

        return {
            /**
             * Cancels a currently running task
             * @param TasksCancelParams
             * @returns TasksCancelResponse
            */
            async cancel(
                params: ClientParams.TasksCancelParams
            ): Promise<ClientResponse.TasksCancelResponse> {
                const parsedParams = methods.convertTasksCancelParams(
                    params as ClientParams.TasksCancelParams,
                    distributionMeta
                );

                const resp = await client.tasks.cancel(parsedParams);

                return _removeBody(resp);
            },
            /**
             * Gets information about a running task
             * @param TasksGetParams
             * @returns TasksGetResponse
            */
            async get(
                params: ClientParams.TasksGetParams
            ): Promise<ClientResponse.TasksGetResponse> {
                const parsedParams = methods.convertTasksGetParams(
                    params as ClientParams.TasksGetParams,
                    distributionMeta
                );

                const resp = await client.tasks.get(parsedParams);

                return _removeBody(resp);
            },
            /**
             * Returns information about the tasks currently executing in the cluster.
             * @param TasksListParams
             * @returns TasksListResponse
            */
            async list(
                params: ClientParams.TasksListParams
            ): Promise<ClientResponse.TasksListResponse> {
                const parsedParams = methods.convertTasksListParams(
                    params as ClientParams.TasksListParams,
                    distributionMeta
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
