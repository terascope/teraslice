import { modelNames } from '@terascope/data-access';
import { ManagerContext } from '../interfaces';

const resolvers = {
    async updatePassword(root: any, args: any, ctx: ManagerContext) {
        return ctx.manager.updatePassword(args, ctx.user);
    },
    async updateToken(root: any, args: any, ctx: ManagerContext) {
        return ctx.manager.updateToken(args, ctx.user);
    },
};

modelNames.forEach((model) => {
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
