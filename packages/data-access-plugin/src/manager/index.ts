import get from 'lodash.get';
import { Express, Request } from 'express';
import { Client } from 'elasticsearch';
import { Logger, toBoolean, trim } from '@terascope/utils';
import * as apollo from 'apollo-server-express';
import { Context } from '@terascope/job-components';
import { ACLManager, User } from '@terascope/data-access';
import { TeraserverConfig, PluginConfig } from '../interfaces';
import { makeSearchFn } from '../search/utils';
import { makeErrorHandler, getESClient } from '../utils';
import { formatError } from './utils';
import schema from './schema';

/**
 * A graphql api for managing data access
 *
 * @todo the manager should be able to pull relational data
 * @todo add session support
*/
export default class ManagerPlugin {
    readonly config: TeraserverConfig;
    readonly logger: Logger;
    readonly app: Express;
    readonly manager: ACLManager;
    readonly server: apollo.ApolloServer;
    readonly bootstrapMode: boolean;
    readonly client: Client;
    readonly context: Context;

    constructor(pluginConfig: PluginConfig) {
        this.config = pluginConfig.server_config;
        this.logger = pluginConfig.logger;
        this.app = pluginConfig.app;
        this.context = pluginConfig.context;

        const connection: string = get(this.config, 'data_access.connect', 'default');
        const namespace: string = get(this.config, 'data_access.namespace');
        const bootstrapMode: boolean = get(this.config, 'data_access.bootstrap_mode', false);

        this.client = getESClient(this.context, connection);

        this.bootstrapMode = bootstrapMode;

        this.manager = new ACLManager(this.client, {
            namespace,
            logger: pluginConfig.logger,
        });

        this.server = new apollo.ApolloServer({
            schema,
            context: async ({ req }) => {
                if (req.body.operationName === 'IntrospectionQuery') {
                    return {
                        user: false,
                        manager: this.manager,
                    };
                }

                const creds = getCredentialsFromReq(req);
                try {
                    const user = await this.manager.authenticate(creds);
                    return {
                        user,
                        manager: this.manager,
                    };
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
            },
            formatError,
        });
    }

    async initialize() {
        await this.manager.initialize();

        if (!this.bootstrapMode) return;

        const users = await this.manager.findUsers({ query: '*' }, false);
        if (users.length > 0) return;

        const user = await this.manager.createUser({
            user: {
                client_id: 0,
                username: 'admin',
                firstname: 'System',
                lastname: 'Admin',
                email: 'admin@example.com',
                type: 'SUPERADMIN'
            },
            password: 'admin'
        }, false);

        this.logger.info({
            id: user.id,
            client_id: user.client_id,
            username: user.username,
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            type: user.type,
            api_token: user.api_token,
        }, 'bootstrap mode create base admin client');
    }

    async shutdown() {
        return this.manager.shutdown();
    }

    registerRoutes() {
        const managerUri = '/api/v2/data-access';

        const rootErrorHandler = makeErrorHandler('Failure to access /api/v2', this.logger);

        if (this.bootstrapMode) {
            this.logger.warn('Running data-access-plugin in bootstrap mode');
        }

        this.app.use('/api/v2', (req, res, next) => {
            if (req.originalUrl === managerUri) {
                next();
                return;
            }

            // @ts-ignore
            req.aclManager = this.manager;

            const creds = getCredentialsFromReq(req);

            rootErrorHandler(req, res, async () => {
                const user = await this.manager.authenticate(creds);

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

        // this must happen at the end
        this.app.use('/api/v2/:space', (req, res, next) => {
            // @ts-ignore
            const manager: ACLManager = req.aclManager;
            // @ts-ignore
            const user: User = req.v2User;

            const space: string = req.params.space;
            const logger = this.context.apis.foundation.makeLogger({
                module: `search_plugin:${space}`,
                user_id: get(user, 'id')
            });

            const spaceErrorHandler = makeErrorHandler('Failure to access /api/v2/:space', logger);

            spaceErrorHandler(req, res, async () => {
                const accessConfig = await manager.getViewForSpace({
                    token: get(user, 'api_token'),
                    space,
                }, user);

                req.query.pretty = toBoolean(req.query.pretty);

                const connection = get(accessConfig, 'search_config.connection', 'default');
                const client = getESClient(this.context, connection);

                const search = makeSearchFn(client, accessConfig, logger);

                // @ts-ignore
                req.space = {
                    searchErrorHandler: makeErrorHandler('Search failure', logger),
                    accessConfig,
                    search,
                    logger,
                };

                next();
            });
        });

    }
}

export function getCredentialsFromReq(req: Request): { token?: string, username?: string, password?: string } {
    const queryToken: string = get(req, 'query.token');
    if (queryToken) return { token: queryToken } ;

    const authToken: string = get(req, 'headers.authorization');
    if (!authToken) return { };

    let [part1, part2] = authToken.split(' ');
    part1 = trim(part1);
    part2 = trim(part2);

    if (part1 === 'Token') {
        return { token: trim(part2) };
    }

    if (part1 === 'Basic') {
        const parsed = Buffer.from(part2, 'base64').toString('utf8');
        const [username, password] = parsed.split(':');
        return { username, password };
    }

    return {};
}
