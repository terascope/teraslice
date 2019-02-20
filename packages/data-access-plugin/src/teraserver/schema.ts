import { makeExecutableSchema } from 'apollo-server-express';
import {
    graphqlSchemas as typeDefs,
    graphqlQueryMethods,
    graphqlMutationMethods,
    ACLManager,
} from '@terascope/data-access';

interface CTX {
    manager: ACLManager;
}

const queryResolvers: Resolvers = {};
graphqlQueryMethods.forEach((method) => {
    queryResolvers[method] = (root, args, ctx: CTX) => {
        // @ts-ignore
        return ctx.manager[method](args);
    };
});

const mutationResolvers: Resolvers = {};
graphqlMutationMethods.forEach((method) => {
    mutationResolvers[method] = (root, args, ctx: CTX) => {
        // @ts-ignore
        return ctx.manager[method](args);
    };
});

const resolvers: AllResolvers = {
    Query: queryResolvers,
    Mutation: mutationResolvers,
};

interface Resolvers {
    [fn: string]: (root: any, args: any, ctx: CTX) => Promise<any>;
}

interface AllResolvers {
    Query: Resolvers;
    Mutation: Resolvers;
}

export = makeExecutableSchema({
    typeDefs,
    resolvers,
});
