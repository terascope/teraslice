import { makeExecutableSchema } from 'apollo-server-express';
import { graphqlSchemas as typeDefs, ACLManager } from '@terascope/data-access';

interface CTX {
    manager: ACLManager;
}

const resolvers: Resolvers = {
    Query: {
        findUser(root, args, ctx: CTX) {
            return ctx.manager.findUser(args.id);
        },
    },
    Mutation: {
        createUser(root, args, ctx: CTX) {
            return ctx.manager.createUser(args.user, args.password);
        },
        updateUser(root, args, ctx: CTX) {
            return ctx.manager.updateUser(args.user);
        },
        updatePassword(root, args, ctx: CTX) {
            return ctx.manager.updatePassword(args.id, args.password);
        },
        removeUser(root, args, ctx: CTX) {
            return ctx.manager.removeUser(args.id);
        },
    }
};

interface Resolvers {
    [type: string]: {
        [fn: string]: (root: any, args: any, ctx: CTX) => Promise<any>;
    };
}

export = makeExecutableSchema({
    typeDefs,
    resolvers,
});
