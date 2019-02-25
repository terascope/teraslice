import get from 'lodash.get';
import { Express } from 'express';
import { Client } from 'elasticsearch';
import { Logger, parseErrorInfo } from '@terascope/utils';
import { QueryAccess, ACLManager, PrivateUserModel } from '@terascope/data-access';
import { TeraserverConfig, PluginConfig } from '../interfaces';

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

                const queryAccess = new QueryAccess(config);
                const dsl = queryAccess.restrictQuery(q, 'dsl', {
                    index: `${space}-*`
                });

                const result = await this.client.search(dsl);
                res.status(200).send(result);
            } catch (err) {
                const { message, statusCode } = parseErrorInfo(err);
                res.status(statusCode).send({ error: message });
            }
        });
    }
}
