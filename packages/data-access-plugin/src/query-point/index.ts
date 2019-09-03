import { Express } from 'express';
import * as apollo from 'apollo-server-express';
import { Context } from '@terascope/job-components';
import { Logger, TSError } from '@terascope/utils';
import { TeraserverConfig, PluginConfig } from '../interfaces';
import { DynamicApolloServer } from './dynamic-server';
import typeDefs from './types';
import { defaultResolvers as resolvers } from './resolvers';
import { validateJoins } from './utils';
import * as utils from '../manager/utils';

export default class QueryPointPlugin {
    readonly config: TeraserverConfig;
    readonly logger: Logger;
    readonly app: Express;
    readonly server: DynamicApolloServer;
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
            context: async ({ req }) => {
                const { query, operationName } = req.body;
                if (operationName !== 'IntrospectionQuery' && query) {
                    validateJoins(query);
                }
            },
            formatError: utils.formatError(true),
            introspection: true,
        });

        if (pluginConfig.server_config.data_access == null) {
            throw new TSError('no data_access configuration is provided', { statusCode: 503 });
        }

        const dataAccess = pluginConfig.server_config.data_access;
        const complexitySize = dataAccess.complexity_limit || 10000 ** 2;
        const concurrency = dataAccess.concurrency || 10;

        this.server.complexitySize = complexitySize;
        this.server.concurrency = concurrency;
        this.server.pluginContext = pluginConfig.context;
        this.server.logger = this.logger;
    }

    async initialize() {}

    async shutdown() {}

    registerRoutes() {
        const queryPointURI = '/api/v2/qp';
        this.logger.info(`Registering data-access-plugin query-point at ${queryPointURI}`);
        this.server.applyMiddleware({
            app: this.app,
            path: queryPointURI,
        });
    }
}
