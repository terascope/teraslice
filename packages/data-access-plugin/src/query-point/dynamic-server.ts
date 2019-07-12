import { get, TSError } from '@terascope/utils';
import * as apollo from 'apollo-server-express';
import accepts from 'accepts';
import { json } from 'body-parser';
import { User } from '@terascope/data-access';
import { renderPlaygroundPage, RenderPageOptions as PlaygroundRenderPageOptions } from '@apollographql/graphql-playground-html';
/* Don't think it's exported normally, get directly */
import { graphqlExpress } from 'apollo-server-express/dist/expressApollo';

import * as utils from '../manager/utils';
import getSchemaByRole from './dynamic-schema';
import { makeErrorHandler } from '../utils';

export class DynamicApolloServer extends apollo.ApolloServer {
    applyMiddleware({ app, path = '/graphql' }: apollo.ServerRegistration) {
        /* Adds project specific middleware inside, just to keep in one place */
        // @ts-ignore
        const loginErrorHandler = makeErrorHandler('Failure to login user', this.logger);
        // @ts-ignore
        const schemaErrorHandler = makeErrorHandler('Failure to create schema', this.logger);

        app.use(path, json(), async (req, res, next) => {
            // @ts-ignore
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
                    // perform more expensive content-type check only if necessary
                    // XXX We could potentially move this logic into the GuiOptions lambda,
                    // but I don't think it needs any overriding
                    const accept = accepts(req);
                    const types = accept.types() as string[];
                    const prefersHTML = types.find((x: string) => x === 'text/html' || x === 'application/json') === 'text/html';

                    if (prefersHTML) {
                        const playgroundRenderPageOptions: PlaygroundRenderPageOptions = {
                            endpoint: path,
                            subscriptionEndpoint: this.subscriptionsPath,
                            ...this.playgroundOptions,
                        };
                        res.setHeader('Content-Type', 'text/html');
                        const playground = renderPlaygroundPage(playgroundRenderPageOptions);
                        res.write(playground);
                        res.end();
                        return;
                    }
                }
                /* Not necessary, but removing to ensure schema built on the request */
                // tslint:disable-next-line
                const { schema, ...serverObj } = this;

                schemaErrorHandler(req, res, async () => {
                    // TODO: check if user is false
                    // @ts-ignore
                    const roleSchema = await getSchemaByRole(req.aclManager, user, this.logger, this.pluginContext);

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
                            formatError: utils.formatError,
                            introspection: !!user.role,
                            playground: {
                                settings: {
                                    'request.credentials': 'include',
                                },
                            } as apollo.PlaygroundConfig,
                        })
                    )(req, res, next);
                });
            });
        });
    }
}
