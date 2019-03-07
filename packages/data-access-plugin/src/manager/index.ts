import get from 'lodash.get';
import { Express } from 'express';
import { Client } from 'elasticsearch';
import { Logger } from '@terascope/utils';
import * as apollo from 'apollo-server-express';
import { ACLManager } from '@terascope/data-access';
import { TeraserverConfig, PluginConfig } from '../interfaces';
import { makeSearchFn } from '../search/utils';
import { getFromReq, makeErrorHandler } from '../utils';
import { formatError } from './utils';
import schema from './schema';

/**
 * A graphql api for managing data access
 *
 * @todo add authentication verification
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

        const rootErrorHandler = makeErrorHandler('Failure to access /api/v2', this.logger);

        if (this.bootstrapMode) {
            this.logger.warn('Running data-access-plugin in Bootstrap Mode');
        }

        this.app.use('/api/v2', (req, res, next) => {
            // @ts-ignore
            req.aclManager = this.manager;

            const apiToken = getFromReq(req, 'api_token');

            // If we are in bootstrap mode, we want to provide
            // unauthenticated access to the data access management
            if (this.bootstrapMode && req.path === '/data-access') {
                next();
                return;
            }

            rootErrorHandler(req, res, async () => {
                const user = await this.manager.authenticateWithToken({
                    api_token: apiToken,
                });

                // @ts-ignore
                req.v2User = user;
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
            app: this.app,
            path: managerUri,
        });

        const spaceErrorHandler = makeErrorHandler('Failure to access /api/v2/:space', this.logger);
        // this must happen at the end
        this.app.use('/api/v2/:space', (req, res, next) => {
            // @ts-ignore
            const manager: ACLManager = req.aclManager;
            // @ts-ignore
            const user: PrivateUserModel = req.v2User;

            const space: string = req.params.space;

            spaceErrorHandler(req, res, async () => {
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
            });
        });

    }
}
