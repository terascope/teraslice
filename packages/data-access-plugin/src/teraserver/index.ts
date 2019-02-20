import { Express } from 'express';
import { STATUS_CODES } from 'http';
import { Logger, getErrorStatusCode } from '@terascope/utils';
import { ACLManager } from '@terascope/data-access';
import * as apollo from 'apollo-server-express';
import schema from './schema';
import { TeraserverConfig, PluginConfig } from '../interfaces';
import { getErrorMessage } from 'elasticsearch-store/dist/src/utils';

export default class TeraserverPlugin {
    readonly config: TeraserverConfig;
    readonly logger: Logger;
    readonly app: Express;
    readonly manager: ACLManager;
    readonly server: apollo.ApolloServer;
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

        this.server = new apollo.ApolloServer({
            schema,
            context: {
                manager: this.manager,
            },
            formatError(err: any) {
                if (err && err.locations && err.source) {
                    return err;
                }

                const statusCode = getErrorStatusCode(err);
                const message = getErrorMessage(err);
                const code = STATUS_CODES[statusCode];

                if (statusCode === 403) {
                    const error = new apollo.AuthenticationError(message);
                    error.originalError = err;
                    if (err && err.stack) error.stack = err.stack;
                    return error;
                }

                if (statusCode >= 400 && statusCode < 500) {
                    const ErrorInstance = statusCode === 422 ? apollo.ValidationError : apollo.UserInputError;
                    const error = new ErrorInstance(message);
                    error.originalError = err;
                    if (err && err.stack) error.stack = err.stack;
                    return error;
                }

                const error = new apollo.ApolloError(message, code);
                error.originalError = err;
                if (err && err.stack) error.stack = err.stack;
                return error;
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
