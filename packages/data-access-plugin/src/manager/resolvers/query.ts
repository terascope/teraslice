import { firstToLower } from '@terascope/utils';
import { setLoggedInUser, forEachModel } from '../utils';
import { ManagerContext } from '../interfaces';

const resolvers = {
    async authenticate(root: any, args: any, ctx: ManagerContext) {
        const user = await ctx.manager.authenticate(args);
        setLoggedInUser(ctx.req, user);
        ctx.user = user;
        return user;
    },
};

forEachModel((model) => {
    resolvers[`${firstToLower(model)}`] = proxyMethod(`find${model}`);
    resolvers[`${firstToLower(model)}s`] = proxyMethod(`find${model}s`);
});

function proxyMethod(method: string) {
    return (root: any, args: any, ctx: ManagerContext) => {
        return ctx.manager[method](args, ctx.user);
    };
}

export default {
    Query: resolvers,
};
