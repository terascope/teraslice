
import { get } from '@terascope/utils';
import * as apollo from 'apollo-server-express';
import accepts from 'accepts';
import { json } from 'body-parser';
import { User } from '@terascope/data-access';
import {
  renderPlaygroundPage,
  RenderPageOptions as PlaygroundRenderPageOptions,
} from '@apollographql/graphql-playground-html';
/* Don't think it's exported normally, get directly */
import { graphqlExpress } from 'apollo-server-express/dist/expressApollo';

import * as utils from '../manager/utils';
import { SpacesContext } from './interfaces';
import getSchemaByRole from './dynamic-schema';

export class DynamicApolloServer extends apollo.ApolloServer {
    applyMiddleware({
        app,
        path = '/graphql',
    }: apollo.ServerRegistration) {
        /* Adds project specific middleware inside, just to keep in one place */
        app.use(path, json(), async (req, res, next) => {
            // @ts-ignore
            if (this.playgroundOptions && req.method === 'GET') {
                // perform more expensive content-type check only if necessary
                // XXX We could potentially move this logic into the GuiOptions lambda,
                // but I don't think it needs any overriding
                const accept = accepts(req);
                const types = accept.types() as string[];
                const prefersHTML =
                types.find(
                    (x: string) => x === 'text/html' || x === 'application/json',
                ) === 'text/html';

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
            let user: User;
            let roleSchema: any;
            try {
                user = await utils.login(get(req, 'aclManager'), req) as User;
            } catch (err) {
                // @ts-ignore
                this.logger.error(err, req);
                if (err.statusCode === 401) {
                    return res.status(401).send(new apollo.AuthenticationError(err.message));
                }
                if (err.statusCode === 403) {
                    return res.status(403).send(new apollo.ForbiddenError(err.message));
                }
                // TODO: how should I send back this error?
                return res.status(500).send(err.message);
            }

            try {
                // TODO: check if user is false
                // @ts-ignore
                roleSchema = await getSchemaByRole(req.aclManager, user, this.logger, this.pluginContext);
            } catch (err) {
                console.log('what is the error', err)
                // @ts-ignore
                this.logger.error(err, req);
                // TODO: how should I send back this error?
                return res.status(500).send({ error: 'could not build schema for this user' });
            }

            /**
             * This is the main reason to extend, to access graphqlExpress(),
             * to be able to modify the schema based on the request
             * It binds to our new object, since the parent accesses the schema
             * from this.schema etc.
             */
            // TODO: should this be returned
            console.log('what about introspection', !!user)
            return graphqlExpress(
                // @ts-ignore
                super.createGraphQLServerOptions.bind({
                    ...serverObj,
                    graphqlPath: path,
                    /* Retrieves a custom graphql schema based on request */
                    schema: roleSchema,
                    formatError: utils.formatError,
                    introspection: !!user,
                    playground: {
                        settings: {
                            'request.credentials': 'include',
                        }
                    } as apollo.PlaygroundConfig,
                    // @ts-ignore
                    context: async ({ req }) => {
                        let skipAuth = false;
                        const { operationName } = req.body;
                        if (operationName === 'IntrospectionQuery') {
                            skipAuth = true;
                        }

                        const ctx: SpacesContext = {
                            req,
                            user: false,
                            // @ts-ignore
                            logger: this.logger,
                            authenticating: false,
                        };

                        if (skipAuth) {
                            ctx.authenticating = true;
                            return ctx;
                        }

                        ctx.user = user;
                        return ctx;
                    }
                })
            )(req, res, next);
        });
    }
}
