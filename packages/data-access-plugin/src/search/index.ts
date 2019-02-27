import { Express } from 'express';
import { Client } from 'elasticsearch';
import elasticsearchAPI from '@terascope/elasticsearch-api';
import { Logger, parseErrorInfo, TSError } from '@terascope/utils';
import { ACLManager, PrivateUserModel } from '@terascope/data-access';
import { search } from './utils';
import { TeraserverConfig, PluginConfig } from '../interfaces';

export default class SearchPlugin {
    readonly config: TeraserverConfig;
    readonly logger: Logger;
    readonly app: Express;
    readonly client: Client;
    private esApis: { [id: string]: elasticsearchAPI.Client } = {};

    constructor(pluginConfig: PluginConfig) {
        this.client = pluginConfig.elasticsearch;
        this.config = pluginConfig.server_config;
        this.logger = pluginConfig.logger;
        this.app = pluginConfig.app;
    }

    async initialize() {}

    async shutdown() {}

    registerRoutes() {
        const searchUrl = '/api/v2/:space';
        this.logger.info(`Registering data-access-plugin search at ${searchUrl}`);

        this.app.use(searchUrl, async (req, res) => {
            // @ts-ignore
            const manager: ACLManager = req.aclManager;
            // @ts-ignore
            const user: PrivateUserModel = req.v2User;
            const space: string = req.params.space;

            try {
                const config = await manager.getViewForSpace({
                    api_token: user.api_token,
                    space,
                });

                if (this.esApis[config.space_id] == null) {
                    const esAPI = elasticsearchAPI(this.client, this.logger, config.space_metadata.indexConfig);
                    this.esApis[config.space_id] = esAPI;
                }

                const esApi = this.esApis[config.space_id];

                const result = await search(req, esApi, config, this.logger);
                res.status(200).send(result);
            } catch (_err) {
                const err = new TSError(_err,  {
                    reason: 'failed to search with query',
                    context: req.query,
                });

                this.logger.error(err);
                res.status(err.statusCode).send({
                    error: err.message
                });
            }
        });
    }
}
