import { Express } from 'express';
import { Client } from 'elasticsearch';
import * as apollo from 'apollo-server-express';
import { Context } from '@terascope/job-components';
import { Logger, toBoolean, get } from '@terascope/utils';
import { ACLManager, User } from '@terascope/data-access';
import { TeraserverConfig, PluginConfig } from '../interfaces';
import { makeSearchFn } from '../search/utils';
import { makeErrorHandler, getESClient } from '../utils';
import * as utils from './utils';

/**
 * A graphql api for managing data access
 *
 * @todo the manager should be able to pull relational data
*/
export default class ManagerPlugin {
    readonly config: TeraserverConfig;
    readonly logger: Logger;
    readonly app: Express;
    readonly manager: ACLManager;
    readonly server: apollo.ApolloServer;
    readonly client: Client;
    readonly context: Context;

    constructor(pluginConfig: PluginConfig) {
        this.config = pluginConfig.server_config;
        this.logger = pluginConfig.logger;
        this.app = pluginConfig.app;
        this.context = pluginConfig.context;

        const connection: string = get(this.config, 'data_access.connection', 'default');
        const namespace: string = get(this.config, 'data_access.namespace');

        this.client = getESClient(this.context, connection);

        this.manager = new ACLManager(this.client, {
            namespace,
            logger: pluginConfig.logger,
        });

        this.server = new apollo.ApolloServer({
            schema: utils.makeGraphqlSchema(),
            context: async ({ req }) => {
                let skipAuth = false;
                const { query, operationName } = req.body;
                if (operationName === 'IntrospectionQuery') {
                    skipAuth = true;
                } else if (query && query.includes('authenticate(')) {
                    skipAuth = true;
                }

                if (skipAuth) {
                    return {
                        req,
                        // set this to truthy value so it is only valid for authenticate
                        user: true,
                        manager: this.manager,
                    };
                }

                try {
                    const user = await utils.login(this.manager, req);
                    return {
                        req,
                        user,
                        manager: this.manager,
                    };
                } catch (err) {
                    this.logger.error(err, req);
                    if (err.statusCode === 401) {
                        throw new apollo.AuthenticationError(err.message);
                    }

                    if (err.statusCode === 403) {
                        throw new apollo.ForbiddenError(err.message);
                    }
                    throw err;
                }
            },
            formatError: utils.formatError,
            playground: {
                settings: {
                    'request.credentials': 'include',
                }
            } as apollo.PlaygroundConfig
        });
    }

    async initialize() {
        await this.manager.initialize();
    }

    async shutdown() {
        await this.manager.shutdown();
    }

    registerRoutes() {
        const managerUri = '/api/v2/data-access';

        const rootErrorHandler = makeErrorHandler('Failure to access /api/v2', this.logger);

        this.app.use('/api/v2', (req, res, next) => {
            if (req.originalUrl === managerUri) {
                next();
                return;
            }

            // @ts-ignore
            req.aclManager = this.manager;

            rootErrorHandler(req, res, async () => {
                // login but don't presist session
                await utils.login(this.manager, req, false);
                next();
            });
        });

        this.app.all('/api/v2', (req, res) => {
            // @ts-ignore
            if (req.aclManager != null && req.user != null) {
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
        this.app.use('/api/v2/:endpoint', (req, res, next) => {
            // @ts-ignore
            const manager: ACLManager = req.aclManager;
            // @ts-ignore
            const user: User = req.user;

            const { endpoint } = req.params;
            const logger = this.context.apis.foundation.makeLogger({
                module: `search_plugin:${endpoint}`,
                user_id: get(user, 'id')
            });

            const spaceErrorHandler = makeErrorHandler('Error accessing search endpoint', logger, true);

            spaceErrorHandler(req, res, async () => {
                const accessConfig = await manager.getViewForSpace({
                    space: endpoint
                }, user);

                req.query.pretty = toBoolean(req.query.pretty);

                const connection = get(accessConfig, 'search_config.connection', 'default');
                const client = getESClient(this.context, connection);

                const search = makeSearchFn(client, accessConfig, logger);

                // @ts-ignore
                req.space = {
                    searchErrorHandler: makeErrorHandler('Error during query execution', logger, true),
                    accessConfig,
                    search,
                    logger,
                };

                next();
            });
        });
    }
}
