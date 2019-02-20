import { makeExecutableSchema } from 'apollo-server-express';
import { graphqlSchemas as typeDefs, ACLManager } from '@terascope/data-access';

interface CTX {
    manager: ACLManager;
}

const resolvers: Resolvers = {
    Query: {
        findUser(root, args, ctx: CTX) {
            return ctx.manager.findUser(args);
        },
        findUsers(root, args, ctx: CTX) {
            return ctx.manager.findUsers(args);
        },
    },
    Mutation: {
        createUser(root, args, ctx: CTX) {
            return ctx.manager.createUser(args);
        },
        updateUser(root, args, ctx: CTX) {
            return ctx.manager.updateUser(args);
        },
        updatePassword(root, args, ctx: CTX) {
            return ctx.manager.updatePassword(args);
        },
        removeUser(root, args, ctx: CTX) {
            return ctx.manager.removeUser(args);
        },
        createSpace(root, args, ctx: CTX) {
            return ctx.manager.createSpace(args);
        },
        createRole(root, args, ctx: CTX) {
            return ctx.manager.createRole(args);
        },
        updateRole(root, args, ctx: CTX) {
            return ctx.manager.updateRole(args);
        }
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
