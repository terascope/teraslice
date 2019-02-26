import get from 'lodash.get';
import { Express } from 'express';
import { Client } from 'elasticsearch';
import elasticsearchAPI from '@terascope/elasticsearch-api';
import { IndexStore } from 'elasticsearch-store';
import { Logger, parseErrorInfo } from '@terascope/utils';
import { QueryAccess, ACLManager, PrivateUserModel } from '@terascope/data-access';
import { TeraserverConfig, PluginConfig } from '../interfaces';

export default class SearchPlugin {
    readonly config: TeraserverConfig;
    readonly logger: Logger;
    readonly app: Express;
    readonly client: Client;
    private stores: { [id: string]: IndexStore<any> } = {};
    private esApis: { [id: string]: elasticsearchAPI.Client } = {};

    constructor(pluginConfig: PluginConfig) {
        this.client = pluginConfig.elasticsearch;
        this.config = pluginConfig.server_config;
        this.logger = pluginConfig.logger;
        this.app = pluginConfig.app;
    }

    async initialize() {
    }

    async shutdown() {
        await Promise.all(Object.values(this.stores)
            .map((store) => store.shutdown()));
    }

    registerRoutes() {
        const searchUrl = '/api/v2/:space/search';
        this.logger.info(`Registering data-access-plugin search at ${searchUrl}`);

        this.app.get(searchUrl, async (req, res) => {
            // @ts-ignore
            const manager: ACLManager = req.aclManager;
            // @ts-ignore
            const user: PrivateUserModel = req.v2User;
            const space: string = req.params.space;

            try {
                const q = get(req.body, 'q', get(req.query, 'q'));

                const config = await manager.getViewForSpace({
                    api_token: user.api_token,
                    space,
                });

                const metadata: {
                    client: string,
                    indexConfig: any
                } = config.space_metadata;

                const queryAccess = new QueryAccess(config);
                if (metadata.client === 'elasticsearch-store') {
                    const query = queryAccess.restrictQuery(q);
                    if (this.stores[config.space_id] != null) {
                        const store = new IndexStore(this.client, metadata.indexConfig);
                        await store.initialize();
                        this.stores[config.space_id] = store;
                    }

                    const store = this.stores[config.space_id];
                    const result = await store.search(query);
                    res.status(200).send(result);

                } else {
                    const query = queryAccess.restrictQuery(q, 'dsl', {
                        index: metadata.indexConfig.index
                    });

                    if (this.esApis[config.space_id] != null) {
                        const esAPI = elasticsearchAPI(this.client, metadata.indexConfig);
                        this.esApis[config.space_id] = esAPI;
                    }

                    const esAPI = this.esApis[config.space_id];
                    const result = await esAPI.search(query);
                    res.status(200).send(result);
                }
            } catch (err) {
                const { message, statusCode } = parseErrorInfo(err);

                res.status(statusCode).send({
                    error: message
                });
            }
        });
    }
}
