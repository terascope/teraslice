import { Express } from 'express';
import { Client } from 'elasticsearch';
import { Context } from '@terascope/job-components';
import { Logger, toBoolean, get, TSError } from '@terascope/utils';
import { DataAccessConfig, User, ACLManager } from '@terascope/data-access';
import { TeraserverConfig, PluginConfig } from '../interfaces';
import { SearchFn } from './interfaces';
import { ErrorHandlerFn, getESClient, makeErrorHandler } from '../utils';
import { makeSearchFn } from './utils';
import * as managerUtils from '../manager/utils';

/**
 * @todo add support for the search counter
 */
const searchUrl = '/api/v2/:endpoint';

export default class SearchPlugin {
    readonly config: TeraserverConfig;
    readonly logger: Logger;
    readonly app: Express;
    readonly client: Client;
    readonly context: Context;

    constructor(pluginConfig: PluginConfig) {
        this.client = pluginConfig.elasticsearch;
        this.config = pluginConfig.server_config;
        this.logger = pluginConfig.logger;
        this.app = pluginConfig.app;
        this.context = pluginConfig.context;
    }

    async initialize() {}
    async shutdown() {}

    registerRoutes() {
        this.logger.info(`Registering data-access-plugin search endpoint at GET ${searchUrl}`);
        this.app.get(searchUrl, (req, res) => {
            // @ts-ignore
            const space: SpaceSearch = req.space;
            if (!space) {
                this.logger.error('Space middleware not setup properly');
                res.sendStatus(500);
                return;
            }

            space.searchErrorHandler(req, res, async () => {
                const result = await space.search(req.query);

                res.status(200).set('Content-type', 'application/json; charset=utf-8');

                if (req.query.pretty) {
                    res.send(JSON.stringify(result, null, 2));
                } else {
                    res.json(result);
                }
            });
        });
    }

    registerMiddleware() {
        this.logger.info(`Registering data-access-plugin search middleware at ${searchUrl}`);

        this.app.use(searchUrl, (req, res, next) => {
            const manager: ACLManager = get(req, 'aclManager');
            const user: User = managerUtils.getLoggedInUser(req)!;

            const { endpoint } = req.params;
            const logger = this.context.apis.foundation.makeLogger({
                module: `search_plugin:${endpoint}`,
                user_id: get(user, 'id'),
            });

            const spaceErrorHandler = makeErrorHandler('Error accessing search endpoint', logger);
            const searchErrorHandler = makeErrorHandler('Error during query execution', logger);

            spaceErrorHandler(req, res, async () => {
                let accessConfig: DataAccessConfig;
                try {
                    accessConfig = await manager.getViewForSpace(
                        {
                            space: endpoint,
                        },
                        user
                    );
                } catch (error) {
                    throw new TSError('Access Denied', {
                        statusCode: error.statusCode === 401 ? 401 : 403,
                        context: {
                            realError: error,
                            safe: true,
                        },
                    });
                }

                req.query.pretty = toBoolean(req.query.pretty);

                const connection = get(accessConfig, 'config.connection', 'default');
                const client = getESClient(this.context, connection);

                const search = makeSearchFn(client, accessConfig, logger);

                const space: SpaceSearch = {
                    searchErrorHandler,
                    accessConfig,
                    search,
                    logger,
                };

                // @ts-ignore
                req.space = space;

                next();
            });
        });
    }
}

export interface SpaceSearch {
    searchErrorHandler: ErrorHandlerFn;
    accessConfig: DataAccessConfig;
    search: SearchFn;
    logger: Logger;
}
