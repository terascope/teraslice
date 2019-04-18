import { ManagerContext } from '../interfaces';
import { forEachModel } from '../utils';

const resolvers = {
    async updatePassword(root: any, args: any, ctx: ManagerContext) {
        return ctx.manager.updatePassword(args, ctx.user);
    },
    async updateToken(root: any, args: any, ctx: ManagerContext) {
        return ctx.manager.updateToken(args, ctx.user);
    },
};

forEachModel((model) => {
    const createMethod = `create${model}`;
    const updateMethod = `update${model}`;
    const removeMethod = `remove${model}`;
    resolvers[createMethod] = proxyMethod(createMethod);
    resolvers[updateMethod] = proxyMethod(updateMethod);
    resolvers[removeMethod] = proxyMethod(removeMethod);
});

function proxyMethod(method: string) {
    return (root: any, args: any, ctx: ManagerContext) => {
        return ctx.manager[method](args, ctx.user);
    };
}

export default {
    Mutation: resolvers
};
