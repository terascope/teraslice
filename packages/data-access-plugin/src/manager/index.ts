import get from 'lodash.get';
import { Express } from 'express';
import { Client } from 'elasticsearch';
import * as apollo from 'apollo-server-express';
import { ACLManager } from '@terascope/data-access';
import { Logger, parseErrorInfo, TSError } from '@terascope/utils';
import { TeraserverConfig, PluginConfig } from '../interfaces';
import { makeSearchFn } from '../search/utils';
import { getFromReq } from '../utils';
import { formatError } from './utils';
import schema from './schema';

/**
 * A graphql api for managing data access
 *
 * @todo we need session support
*/
export default class ManagerPlugin {
    readonly config: TeraserverConfig;
    readonly logger: Logger;
    readonly app: Express;
    readonly manager: ACLManager;
    readonly server: apollo.ApolloServer;
    readonly bootstrapMode: boolean;
    readonly client: Client;

    constructor(pluginConfig: PluginConfig) {
        const client = pluginConfig.elasticsearch;
        this.config = pluginConfig.server_config;
        this.logger = pluginConfig.logger;
        this.app = pluginConfig.app;
        this.client = client;

        const namespace = get(this.config, 'data_access.namespace');
        this.bootstrapMode = get(this.config, 'data_access.bootstrap_mode', false);

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
        const managerUri = '/api/v2/data-access';

        this.app.use('/api/v2', async (req, res, next) => {
            // @ts-ignore
            req.aclManager = this.manager;

            const username = getFromReq(req, 'username');
            const password = getFromReq(req, 'password');
            const apiToken = getFromReq(req, 'api_token');

            // If we are in bootstrap mode, we want to provide
            // unauthenticated access to the data access management
            if (this.bootstrapMode && req.path === '/data-access') {
                next();
                return;
            }

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

        this.logger.info(`Registering data-access-plugin manager at ${managerUri}`);
        this.server.applyMiddleware({
            app: this.app,
            path: managerUri,
        });

        // this must happen at the end
        this.app.use('/api/v2/:space', async (req, res, next) => {
            // @ts-ignore
            const manager: ACLManager = req.aclManager;
            // @ts-ignore
            const user: PrivateUserModel = req.v2User;

            const space: string = req.params.space;

            try {
                const accessConfig = await manager.getViewForSpace({
                    api_token: get(user, 'api_token'),
                    space,
                });

                const search = makeSearchFn(this.client, accessConfig, this.logger);

                // @ts-ignore
                req.space = {
                    accessConfig,
                    search
                };

                next();
            } catch (_err) {
                const err = new TSError(_err,  {
                    reason: `Failure to access space ${space}`
                });

                this.logger.error(err);
                res.status(err.statusCode).json({
                    error: err.message.replace(/[A-Z]{2}Error/g, 'Error')
                });
            }
        });

    }
}
