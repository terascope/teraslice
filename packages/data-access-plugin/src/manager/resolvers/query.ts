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
    const findOneMethod = `find${model}`;
    const findManyMethod = `find${model}s`;
    resolvers[findOneMethod] = proxyMethod(findOneMethod);
    resolvers[findManyMethod] = proxyMethod(findManyMethod);
});

function proxyMethod(method: string) {
    return (root: any, args: any, ctx: ManagerContext) => {
        return ctx.manager[method](args, ctx.user);
    };
}

export default {
    Query: resolvers,
};
