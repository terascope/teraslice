import get from 'lodash.get';
import { Express } from 'express';
import { Client } from 'elasticsearch';
import { Logger, TSError } from '@terascope/utils';
import { ACLManager, PrivateUserModel, DataAccessConfig } from '@terascope/data-access';
import { TeraserverConfig, PluginConfig } from '../interfaces';
import { SearchFn } from './interfaces';
import { makeSearchFn } from './utils';

/**
 * @todo the search plugin should be able to work the search counter
 */
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

        this.app.use(searchUrl, async (req, res, next) => {
            // @ts-ignore
            const manager: ACLManager = req.aclManager;
            // @ts-ignore
            const user: PrivateUserModel = req.v2User;

            const space: string = req.params.space;

            try {
                const accessConfig = await manager.getViewForSpace({
                    api_token: get(user, 'api_token'),
                    space,
                });

                // @ts-ignore
                req.space = {
                    accessConfig,
                    logger: this.logger,
                    search: makeSearchFn(this.client, accessConfig, this.logger)
                };

                next();
            } catch (_err) {
                const err = new TSError(_err,  {
                    reason: `Failure to access space ${space}`
                });

                this.logger.error(err);
                res.status(err.statusCode).json({
                    error: err.message.replace(/[A-Z]{2}Error/g, 'Error')
                });
            }
        });

        this.app.get(searchUrl, async (req, res) => {
            // @ts-ignore
            const space: SpaceSearch = req.space;
            if (!space) {
                res.sendStatus(500);
                return;
            }

            try {
                const result = await space.search(req.query);

                res
                    .status(200)
                    .set('Content-type', 'application/json; charset=utf-8');

                if (req.query.pretty) {
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

export interface SpaceSearch {
    accessConfig: DataAccessConfig;
    logger: Logger;
    search: SearchFn;
}
