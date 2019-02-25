import { Express } from 'express';
import { STATUS_CODES } from 'http';
import { Logger, parseErrorInfo } from '@terascope/utils';
import { ACLManager } from '@terascope/data-access';
import * as apollo from 'apollo-server-express';
import schema from './schema';
import { TeraserverConfig, PluginConfig } from '../interfaces';

export default class ManagerPlugin {
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
                const { statusCode, message } = parseErrorInfo(err);
                const httpMsg = STATUS_CODES[statusCode] as string;
                const code = httpMsg.replace(' ', '_').toUpperCase();

                let error: any;
                let ErrorInstance: { new(message: string): any };

                if (statusCode >= 400 && statusCode < 500) {
                    if (statusCode === 422) {
                        ErrorInstance = apollo.ValidationError;
                    } else if (statusCode === 401) {
                        ErrorInstance = apollo.AuthenticationError;
                    } else if (statusCode === 403) {
                        ErrorInstance = apollo.ForbiddenError;
                    } else {
                        ErrorInstance = apollo.UserInputError;
                    }
                    if (err instanceof ErrorInstance) {
                        return err;
                    }
                    error = new ErrorInstance(message);
                } else {
                    if (err instanceof apollo.ApolloError) {
                        return err;
                    }
                    error = apollo.toApolloError(err, code);
                }

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
        this.logger.info(`Registering data-access-plugin at ${this.baseUrl}`);

        this.server.applyMiddleware({
            app: this.app,
            path: this.baseUrl,
        });
    }
}
