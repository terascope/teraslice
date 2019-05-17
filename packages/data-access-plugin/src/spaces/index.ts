import { Express } from 'express';
import * as apollo from 'apollo-server-express';
import { Context } from '@terascope/job-components';
import { Logger } from '@terascope/utils';
import { TeraserverConfig, PluginConfig } from '../interfaces';
import { DynamicApolloServer } from './dynamic-server';
import typeDefs from './types';
import { defaultResolvers as resolvers } from './resolvers';
import * as utils from '../manager/utils';

/**
 * A graphql api for managing spaces
 */

export default class SpacesPlugin {
    readonly config: TeraserverConfig;
    readonly logger: Logger;
    readonly app: Express;
    readonly server: apollo.ApolloServer;
    readonly context: Context;

    constructor(pluginConfig: PluginConfig) {
        this.config = pluginConfig.server_config;
        this.logger = pluginConfig.logger;
        this.app = pluginConfig.app;
        this.context = pluginConfig.context;

        this.server = new DynamicApolloServer({
            schema: apollo.makeExecutableSchema({
                typeDefs,
                resolvers,
                inheritResolversFromInterfaces: true,
            }),
            formatError: utils.formatError,
            introspection: true,
        });
        // @ts-ignore
        this.server.pluginContext = pluginConfig.context;
        // @ts-ignore
        this.server.logger = this.logger;
    }

    async initialize() {}

    async shutdown() {}

    registerRoutes() {
        const managerUri = '/api/v2/spaces';
        this.logger.info(`Registering data-access-plugin space manager at ${managerUri}`);
        this.server.applyMiddleware({
            app: this.app,
            path: managerUri,
        });
    }
}
