import GraphQLJSON from 'graphql-type-json';
import * as a from 'apollo-server-express';
import * as d from '@terascope/data-access';

interface ManagerContext {
    manager: d.ACLManager;
}

const queryResolvers: a.IResolverObject<any, ManagerContext, any> = {};
d.graphqlQueryMethods.forEach((method) => {
    queryResolvers[method] = (root, args, ctx: ManagerContext) => {
        return ctx.manager[method](args);
    };
});

const mutationResolvers: a.IResolverObject<any, ManagerContext, any> = {};
d.graphqlMutationMethods.forEach((method) => {
    mutationResolvers[method] = (root, args, ctx: ManagerContext) => {
        return ctx.manager[method](args);
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
