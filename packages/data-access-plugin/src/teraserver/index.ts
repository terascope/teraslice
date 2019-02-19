import { Express } from 'express';
import { Logger } from '@terascope/utils';
import { ACLManager } from '@terascope/data-access';
import { ApolloServer } from 'apollo-server-express';
import schema from './schema';
import { TeraserverConfig, PluginConfig } from '../interfaces';

export default class TeraserverPlugin {
    readonly config: TeraserverConfig;
    readonly logger: Logger;
    readonly app: Express;
    readonly manager: ACLManager;
    readonly server: ApolloServer;
    readonly baseUrl: string;

    constructor(pluginConfig: PluginConfig) {
        const client = pluginConfig.elasticsearch;
        this.config = pluginConfig.server_config;
        this.logger = pluginConfig.logger;
        this.app = pluginConfig.app;
        this.baseUrl = pluginConfig.url_base;

        const namespace = this.config.data_access
            && this.config.data_access.namespace;

        this.manager = new ACLManager(client, {
            namespace,
            logger: pluginConfig.logger,
        });

        this.server = new ApolloServer({
            schema,
            context: {
                manager: this.manager,
            }
        });
    }

    async initialize() {
        return this.manager.initialize();
    }

    async shutdown() {
        return this.manager.shutdown();
    }

    registerRoutes() {
        this.server.applyMiddleware({
            app: this.app,
            path: this.baseUrl,
        });
    }
}
