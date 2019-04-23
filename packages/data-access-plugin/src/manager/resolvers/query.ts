import { firstToLower, get, TSError, isEmpty } from '@terascope/utils';
import { setLoggedInUser, forEachModel, logoutUser } from '../utils';
import { ManagerContext } from '../interfaces';

const resolvers = {
    async authenticate(root: any, args: any, ctx: ManagerContext) {
        const authToken = get(ctx, 'req.v2User.api_token');
        const argToken = get(args, 'token');
        if (authToken && argToken && argToken === authToken) {
            ctx.user = get(ctx, 'req.v2User');
            return ctx.user;
        }
        if (isEmpty(args)) {
            await ctx.login();
            return ctx.user;
        }

        const user = await ctx.manager.authenticate(args);
        setLoggedInUser(ctx.req, user);
        ctx.user = user;
        ctx.authenticating = false;
        return user;
    },
    logout(root: any, args: any, ctx: ManagerContext) {
        logoutUser(ctx.req);
        // @ts-ignore
        ctx.user = { loggedOut: true };
    }
};

forEachModel((model) => {
    const modelName = firstToLower(model);
    resolvers[`${modelName}`] = proxyMethod(`find${model}`);
    resolvers[`${modelName}s`] = proxyMethod(`find${model}s`);
    resolvers[`${modelName}sCount`] = proxyMethod(`count${model}s`);
});

function proxyMethod(method: string) {
    return async (root: any, args: any, ctx: ManagerContext) => {
        if (ctx.authenticating) {
            await waitForAuthentication(method, ctx);
        }
        return ctx.manager[method](args, ctx.user);
    };
}

function waitForAuthentication(method: string, ctx: ManagerContext) {
    ctx.logger.trace('waiting for authentication...');

    const maxWait = 30 * 1000; // 30 seconds
    const startTime = Date.now();
    return new Promise((resolve, reject) => {
        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;

            if (!ctx.authenticating) {
                ctx.logger.debug(`got for authentication for method ${method} after ${elapsed}ms`);
                clearInterval(interval);
                resolve();
                return;
            }

            if (elapsed > maxWait) {
                reject(new TSError('Timeout verifying authentication', {
                    statusCode: 504,
                    context: {
                        elapsed,
                        method,
                    }
                }));
            }
        }, 1);
    });
}

export default {
    Query: resolvers,
};
