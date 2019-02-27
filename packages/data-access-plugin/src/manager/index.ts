import { STATUS_CODES } from 'http';
import { Express } from 'express';
import * as apollo from 'apollo-server-express';
import { ACLManager } from '@terascope/data-access';
import { Logger, parseErrorInfo, TSError } from '@terascope/utils';
import { getFromReq } from '../utils';
import { TeraserverConfig, PluginConfig } from '../interfaces';
import schema from './schema';

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
            resolvers: {
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
        this.logger.info(`Registering data-access-plugin manager at ${this.baseUrl}`);

        this.app.use('/api/v2', async (req, res, next) => {
            // @ts-ignore
            req.aclManager = this.manager;

            const username = getFromReq(req, 'username');
            const password = getFromReq(req, 'password');
            const apiToken = getFromReq(req, 'api_token');

            try {
                // @ts-ignore
                const user = req.user || await this.manager.authenticateUser({
                    username,
                    password,
                    api_token: apiToken,
                });

                if (!user.api_token) {
                    throw new TSError('Unable to get user api_token');
                }

                // @ts-ignore
                req.userApiToken = user.api_token;
                next();
            } catch (err) {
                const { message, statusCode } = parseErrorInfo(err);
                res.status(statusCode).send({ error: message });
            }
        });

        this.server.applyMiddleware({
            app: this.app,
            path: this.baseUrl,
        });
    }
}
