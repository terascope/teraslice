import get from 'lodash.get';
import { Express } from 'express';
import { Client } from 'elasticsearch';
import { Logger, TSError } from '@terascope/utils';
import { ACLManager, PrivateUserModel } from '@terascope/data-access';
import { TeraserverConfig, PluginConfig } from '../interfaces';
import { search } from './utils';

export default class SearchPlugin {
    readonly config: TeraserverConfig;
    readonly logger: Logger;
    readonly app: Express;
    readonly client: Client;

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

        this.app.get(searchUrl, async (req, res) => {
            // @ts-ignore
            const manager: ACLManager = req.aclManager;
            // @ts-ignore
            const user: PrivateUserModel = req.v2User;
            const space: string = req.params.space;

            try {
                const config = await manager.getViewForSpace({
                    api_token: get(user, 'api_token'),
                    space,
                });

                const [result, pretty] = await search(req, this.client, config, this.logger);

                res
                    .status(200)
                    .set('Content-type', 'application/json; charset=utf-8');

                if (pretty) {
                    res.send(JSON.stringify(result, null, 2));
                } else {
                    res.json(result);
                }
            } catch (_err) {
                const err = new TSError(_err,  {
                    reason: 'Search failure',
                    context: req.query
                });

                this.logger.error(err);
                res.status(err.statusCode).json({
                    error: err.message.replace(/[A-Z]{2}Error/g, 'Error')
                });
            }
        });
    }
}
