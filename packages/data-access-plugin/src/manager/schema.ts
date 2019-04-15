import GraphQLJSON from 'graphql-type-json';
import * as a from 'apollo-server-express';
import * as d from '@terascope/data-access';
import { setLoggedInUser } from './utils';
import { ManagerContext } from './interfaces';

const queryResolvers: a.IResolverObject<any, ManagerContext, any> = {};
d.graphqlQueryMethods.forEach((method) => {
    queryResolvers[method] = async (root, args, ctx: ManagerContext) => {
        if (method === 'authenticate') {
            const user = await ctx.manager[method](args);
            setLoggedInUser(ctx.req, user);
            ctx.user = user;
            return user;
        }
        // @ts-ignore
        return ctx.manager[method](args, ctx.user);
    };
});

const mutationResolvers: a.IResolverObject<any, ManagerContext, any> = {};
d.graphqlMutationMethods.forEach((method) => {
    mutationResolvers[method] = (root, args, ctx: ManagerContext) => {
        // @ts-ignore
        return ctx.manager[method](args, ctx.user);
    };
});

const resolvers: a.IResolvers<any, ManagerContext> = {
    Query: queryResolvers,
    Mutation: mutationResolvers,
    JSON: GraphQLJSON,
};

export = a.makeExecutableSchema({
    typeDefs: [
        'scalar JSON',
        ...d.graphqlSchemas
    ],
    resolvers,
    inheritResolversFromInterfaces: true,
});
