import accepts from 'accepts';
import { json } from 'body-parser';
import {
  renderPlaygroundPage,
  RenderPageOptions as PlaygroundRenderPageOptions,
} from '@apollographql/graphql-playground-html';
import { ApolloServer, ServerRegistration, makeExecutableSchema } from 'apollo-server-express';
import * as utils from '../manager/utils';

/* Don't think it's exported normally, get directly */
import { graphqlExpress } from 'apollo-server-express/dist/expressApollo';
// tslint:disable-next-line
import * as apollo from 'apollo-server-express';

import typeDefs from '../manager/types';
import resolvers from '../manager/resolvers';

export class DynamicApolloServer extends ApolloServer {
    applyMiddleware({
        app,
        path = '/graphql',
    }: ServerRegistration) {
        /* Adds project specific middleware inside, just to keep in one place */
        app.use(path, json(), (req, res, next) => {
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
                    schema: makeExecutableSchema({
                        typeDefs,
                        resolvers,
                        inheritResolversFromInterfaces: true,
                    }),
                    formatError: utils.formatError,
                    playground: {
                        settings: {
                            'request.credentials': 'include',
                        }
                    } as apollo.PlaygroundConfig
                })
            )(req, res, next);
        });
    }
}
