import { Express } from 'express';
import { Client } from 'elasticsearch';
import * as apollo from 'apollo-server-express';
import { Context } from '@terascope/job-components';
import { Logger, get, isProd } from '@terascope/utils';
import { ACLManager } from '@terascope/data-access';
import { TeraserverConfig, PluginConfig } from '../interfaces';
import { makeErrorHandler, getESClient } from '../utils';
import typeDefs from './types';
import resolvers from './resolvers';
import * as utils from './utils';
import { ManagerContext } from './interfaces';

/**
 * A graphql api for managing data access
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
            schema: apollo.makeExecutableSchema({
                typeDefs,
                resolvers,
                inheritResolversFromInterfaces: true,
            }),
            context: async ({ req }) => {
                const ctx: ManagerContext = {
                    req,
                    user: false,
                    logger: this.logger,
                    manager: this.manager,
                    authenticating: true,
                    async login() {
                        if (this.user) {
                            this.authenticating = false;
                            return;
                        }

                        const user = await utils.login(this.manager, req);
                        this.user = user;
                        this.authenticating = false;
                    }
                };

                let skipAuth = false;
                const { query, operationName } = req.body;
                if (operationName === 'IntrospectionQuery') {
                    skipAuth = true;
                } else if (query) {
                    /** @todo this should handle the query detection using the query AST */
                    skipAuth = query.includes('authenticate') || query.includes('loggedIn');
                }

                if (skipAuth) {
                    return ctx;
                }

                try {
                    await ctx.login();
                } catch (err) {
                    const obj = {
                        query: req.query,
                        body: req.body,
                        headers: req.headers,
                        method: req.method
                    };
                    this.logger.error(err, obj, 'failure when authentication');
                    if (err.statusCode === 401) {
                        throw new apollo.AuthenticationError(err.message);
                    }

                    if (err.statusCode === 403) {
                        throw new apollo.ForbiddenError(err.message);
                    }
                    throw err;
                }

                return ctx;
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
            // @ts-ignore
            req.aclManager = this.manager;

            if (req.originalUrl === managerUri || req.originalUrl === '/api/v2/spaces') {
                next();
                return;
            }

            rootErrorHandler(req, res, async () => {
                // login but don't presist session
                await utils.login(this.manager, req, false);
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
            cors: isProd ? false : {
                origin: ['http://localhost:3000', 'http://localhost:8000'],
                credentials: true
            },
            app: this.app,
            path: managerUri,
        });
    }
}
