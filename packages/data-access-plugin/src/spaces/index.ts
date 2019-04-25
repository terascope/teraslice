import { Express } from 'express';
import { Client } from 'elasticsearch';
import * as apollo from 'apollo-server-express';
import { Context } from '@terascope/job-components';
import { Logger, get } from '@terascope/utils';
import { SpacesContext } from './interfaces';
import { TeraserverConfig, PluginConfig } from '../interfaces';
import { getESClient } from '../utils';
import { DynamicApolloServer } from '../dynamic-server';
import * as utils from '../manager/utils';
import typeDefs from '../manager/types';
import resolvers from '../manager/resolvers';
/**
 * A graphql api for managing data access
*/
export default class SpacesPlugin {
    readonly config: TeraserverConfig;
    readonly logger: Logger;
    readonly app: Express;
    readonly server: apollo.ApolloServer;
    readonly client: Client;
    readonly context: Context;

    constructor(pluginConfig: PluginConfig) {
        this.config = pluginConfig.server_config;
        this.logger = pluginConfig.logger;
        this.app = pluginConfig.app;
        this.context = pluginConfig.context;

        const connection: string = get(this.config, 'data_access.connection', 'default');

        this.client = getESClient(this.context, connection);

        this.server = new DynamicApolloServer({
            schema: apollo.makeExecutableSchema({
                typeDefs,
                resolvers,
                inheritResolversFromInterfaces: true,
            }),
            context: async ({ req }) => {
                let skipAuth = false;
                const { query, operationName } = req.body;
                if (operationName === 'IntrospectionQuery') {
                    skipAuth = true;
                } else if (query && query.includes('authenticate(')) {
                    skipAuth = true;
                }

                const ctx: SpacesContext = {
                    req,
                    user: false,
                    logger: this.logger,
                    authenticating: false,
                };

                if (skipAuth) {
                    ctx.authenticating = true;
                    return ctx;
                }

                try {
                    const user = await utils.login(get(req, 'aclManager'), req);
                    ctx.user = user;
                    return ctx;
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
            }
        });
    }

    async initialize() {}

    async shutdown() {}

    registerRoutes() {
        const managerUri = '/api/v2/spaces';

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
    }
}
