import get from 'lodash.get';
import { Express } from 'express';
import { Client } from 'elasticsearch';
import elasticsearchAPI from '@terascope/elasticsearch-api';
import { Logger, parseErrorInfo } from '@terascope/utils';
import { QueryAccess, ACLManager, PrivateUserModel } from '@terascope/data-access';
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

            const q = get(req.body, 'q', get(req.query, 'q'));

            try {
                const config = await manager.getViewForSpace({
                    api_token: user.api_token,
                    space,
                });

                const metadata: SpaceMetadata = config.space_metadata;

                const queryAccess = new QueryAccess(config);
                const query = queryAccess.restrictESQuery(q, {
                    index: metadata.indexConfig.index
                });

                if (this.esApis[config.space_id] == null) {
                    const esAPI = elasticsearchAPI(this.client, this.logger, metadata.indexConfig);
                    this.esApis[config.space_id] = esAPI;
                }

                const esAPI = this.esApis[config.space_id];
                this.logger.debug(query, `searching space ${space}...`);
                const result = await esAPI.search(query);
                res.status(200).send(result);
            } catch (err) {
                const { message, statusCode } = parseErrorInfo(err);

                this.logger.error(err, `failed to search with query ${q}`);
                res.status(statusCode).send({
                    error: message
                });
            }
        });
    }
}

interface SpaceMetadata {
    indexConfig: elasticsearchAPI.Config;
}
