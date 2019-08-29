
import {
    get, TSError, startsWith, Logger
} from '@terascope/utils';
import * as apollo from 'apollo-server-express';
import accepts from 'accepts';
import { json } from 'body-parser';
import { User } from '@terascope/data-access';
import { renderPlaygroundPage, RenderPageOptions as PlaygroundRenderPageOptions } from '@apollographql/graphql-playground-html';
/* Don't think it's exported normally, get directly */
import { graphqlExpress } from 'apollo-server-express/dist/expressApollo';
import { Context } from '@terascope/job-components';

import * as utils from '../manager/utils';
import getSchemaByRole from './dynamic-schema';
import { makeErrorHandler } from '../utils';
import makeComplexityPlugin from './plugins';

const formatError = utils.formatError(true);

export class DynamicApolloServer extends apollo.ApolloServer {
    logger!: Logger;
    pluginContext!: Context;
    complexitySize!: number;
    concurrency!: number;

    applyMiddleware({ app, path = '/graphql' }: apollo.ServerRegistration) {
        /* Adds project specific middleware inside, just to keep in one place */
        const loginErrorHandler = makeErrorHandler('Failure to login user', this.logger);
        const schemaErrorHandler = makeErrorHandler('Failure to create schema', this.logger);

        app.use(path, json(), async (req, res, next) => {
            loginErrorHandler(req, res, async () => {
                const user = (await utils.login(get(req, 'aclManager'), req)) as User;
                if (user.role == null) {
                    throw new TSError(`User ${user.username} missing role `, {
                        statusCode: 403,
                        context: {
                            user,
                        },
                    });
                }

                if (this.playgroundOptions && req.method === 'GET') {
                    const accept = accepts(req);
                    const types = accept.types() as string[];
                    const prefersHTML = types.find((x: string) => x === 'text/html' || x === 'application/json') === 'text/html';
                    if (prefersHTML) {
                        let endpoint = `${req.headers.host}${req.baseUrl}`;
                        if (!startsWith(endpoint, 'http')) endpoint = `http://${endpoint}`;

                        const playgroundRenderPageOptions: PlaygroundRenderPageOptions = {
                            ...this.playgroundOptions,
                            endpoint,
                            subscriptionEndpoint: endpoint,
                            settings: {
                                'editor.reuseHeaders': true,
                                // @ts-ignore
                                'schema.polling.interval': 10000,
                                'schema.polling.endpointFilter': path
                            },
                            // @ts-ignore
                            tabs: [{ endpoint, headers: { Authorization: `Token ${user.api_token}` } }]
                        };
                        res.setHeader('Content-Type', 'text/html');
                        const playground = renderPlaygroundPage(playgroundRenderPageOptions);
                        res.write(playground);
                        res.end();
                        return;
                    }
                }
                /* Not necessary, but removing to ensure schema built on the request */
                const { schema, ...serverObj } = this;

                schemaErrorHandler(req, res, async () => {
                    // TODO: check if user is false
                    const roleSchema = await getSchemaByRole(
                        // @ts-ignore
                        req.aclManager,
                        user,
                        this.logger,
                        this.pluginContext,
                        this.concurrency
                    );

                    /**
                     * This is the main reason to extend, to access graphqlExpress(),
                     * to be able to modify the schema based on the request
                     * It binds to our new object, since the parent accesses the schema
                     * from this.schema etc.
                     */

                    return graphqlExpress(
                        // @ts-ignore
                        super.createGraphQLServerOptions.bind({
                            ...serverObj,
                            graphqlPath: path,
                            /* Retrieves a custom graphql schema based on request */
                            schema: roleSchema,
                            formatError,
                            introspection: !!user.role,
                            plugins: [
                                makeComplexityPlugin(
                                    this.logger,
                                    this.complexitySize,
                                    roleSchema,
                                    user.id
                                )
                            ],
                        })
                    )(req, res, next);
                });
            });
        });
    }
}
