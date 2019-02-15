import { ResolverFn } from 'apollo-server-express';

const resolvers: Resolvers = {
    Query: {
        getUser(root, args, ctx) {
            return ctx.manager.users.findById(args.id);
        },
    }
};

interface Resolvers {
    [type: string]: {
        [fn: string]: ResolverFn;
    };
}

export = resolvers;
