import get from 'lodash.get';
import { Express, Request } from 'express';
import { Client } from 'elasticsearch';
import { Logger, toBoolean, trim } from '@terascope/utils';
import * as apollo from 'apollo-server-express';
import { Context } from '@terascope/job-components';
import { ACLManager } from '@terascope/data-access';
import { TeraserverConfig, PluginConfig } from '../interfaces';
import { makeSearchFn } from '../search/utils';
import { makeErrorHandler, getESClient } from '../utils';
import { formatError } from './utils';
import schema from './schema';

/**
 * A graphql api for managing data access
 *
 * @todo add session support
*/
export default class ManagerPlugin {
    readonly config: TeraserverConfig;
    readonly logger: Logger;
    readonly app: Express;
    readonly manager: ACLManager;
    readonly server: apollo.ApolloServer;
    readonly bootstrapMode: boolean;
    readonly client: Client;
    readonly context: Context;

    constructor(pluginConfig: PluginConfig) {
        this.config = pluginConfig.server_config;
        this.logger = pluginConfig.logger;
        this.app = pluginConfig.app;
        this.context = pluginConfig.context;

        const connection: string = get(this.config, 'data_access.connect', 'default');
        const namespace: string = get(this.config, 'data_access.namespace');
        const bootstrapMode: boolean = get(this.config, 'data_access.bootstrap_mode', false);

        this.client = getESClient(this.context, connection);

        this.bootstrapMode = bootstrapMode;

        this.manager = new ACLManager(this.client, {
            namespace,
            logger: pluginConfig.logger,
        });

        this.server = new apollo.ApolloServer({
            schema,
            context: async ({ req }) => {
                const token = getTokenFromReq(req);

                if (bootstrapMode && !token) {
                    return {
                        manager: this.manager,
                    };
                }

                const user = await this.manager.authenticateWithToken({
                    api_token: token,
                });

                return {
                    user,
                    manager: this.manager,
                };
            },
            formatError,
        });
    }

    async initialize() {
        return this.manager.initialize();
    }

    async shutdown() {
        return this.manager.shutdown();
    }

    registerRoutes() {
        const managerUri = '/api/v2/data-access';

        const rootErrorHandler = makeErrorHandler('Failure to access /api/v2', this.logger);

        if (this.bootstrapMode) {
            this.logger.warn('Running data-access-plugin in bootstrap mode');
        }

        this.app.use('/api/v2', (req, res, next) => {
            // @ts-ignore
            req.aclManager = this.manager;

            const apiToken = getTokenFromReq(req);

            // If we are in bootstrap mode, we want to provide
            // unauthenticated access to the data access management
            if (this.bootstrapMode && req.path === '/data-access') {
                next();
                return;
            }

            rootErrorHandler(req, res, async () => {
                const user = await this.manager.authenticateWithToken({
                    api_token: apiToken,
                });

                // @ts-ignore
                req.v2User = user;
                next();
            });
        });

        this.app.all('/api/v2', (req, res) => {
            // @ts-ignore
            if (req.aclManager != null && req.v2User != null) {
                res.sendStatus(204);
            } else {
                res.sendStatus(500);
            }
        });

        this.logger.info(`Registering data-access-plugin manager at ${managerUri}`);
        this.server.applyMiddleware({
            app: this.app,
            path: managerUri,
        });

        // this must happen at the end
        this.app.use('/api/v2/:space', (req, res, next) => {
            // @ts-ignore
            const manager: ACLManager = req.aclManager;
            // @ts-ignore
            const user: User = req.v2User;

            const space: string = req.params.space;
            const logger = this.context.apis.foundation.makeLogger({
                module: `search_plugin:${space}`,
                user_id: get(user, 'id')
            });

            const spaceErrorHandler = makeErrorHandler('Failure to access /api/v2/:space', logger);

            spaceErrorHandler(req, res, async () => {
                const accessConfig = await manager.getViewForSpace({
                    api_token: get(user, 'api_token'),
                    space,
                });

                req.query.pretty = toBoolean(req.query.pretty);

                const connection = get(accessConfig, 'search_config.connection', 'default');
                const client = getESClient(this.context, connection);

                const search = makeSearchFn(client, accessConfig, logger);

                // @ts-ignore
                req.space = {
                    searchErrorHandler: makeErrorHandler('Search failure', logger),
                    accessConfig,
                    search,
                    logger,
                };

                next();
            });
        });

    }
}

export function getTokenFromReq(req: Request): string {
    const queryToken: string = get(req, 'query.token');
    if (queryToken) return queryToken;

    const authToken: string = get(req, 'headers.authorization');
    if (!authToken) return '';

    const parts = authToken.split(' ');
    if (trim(parts[0]) === 'Token') {
        return trim(parts[1]);
    }
    return trim(authToken);
}
