import { Express } from 'express';
import * as apollo from 'apollo-server-express';
import { ACLManager } from '@terascope/data-access';
import { Logger, parseErrorInfo } from '@terascope/utils';
import { getFromReq } from '../utils';
import { formatError } from './utils';
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
        this.logger.info(`Registering data-access-plugin manager at ${this.baseUrl}`);

        this.app.use('/api/v2', async (req, res, next) => {
            // @ts-ignore
            req.aclManager = this.manager;

            const username = getFromReq(req, 'username');
            const password = getFromReq(req, 'password');
            const apiToken = getFromReq(req, 'api_token');

            try {
                const user = await this.manager.authenticateUser({
                    username,
                    password,
                    api_token: apiToken,
                });

                // @ts-ignore
                req.v2User = user;
                next();
            } catch (err) {
                const { message, statusCode } = parseErrorInfo(err);
                res.status(statusCode).send({ error: message });
            }
        });

        this.app.all('/api/v2', async (req, res) => {
            // @ts-ignore
            if (req.aclManager != null && req.v2User != null) {
                res.sendStatus(204);
            } else {
                res.sendStatus(500);
            }
        });

        this.server.applyMiddleware({
            app: this.app,
            path: this.baseUrl,
        });
    }
}
