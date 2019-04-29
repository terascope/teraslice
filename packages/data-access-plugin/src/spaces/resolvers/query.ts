
import { get } from '@terascope/utils';
import { setLoggedInUser } from '../../manager/utils';
import { ManagerContext } from '../../manager/interfaces';

export default {
    Query: {
        async authenticate(root: any, args: any, ctx: ManagerContext) {
            const authToken = get(ctx, 'req.v2User.api_token');
            const argToken = get(args, 'token');
            if (authToken && argToken && argToken === authToken) {
                ctx.user = get(ctx, 'req.v2User');
                return ctx.user;
            }

            const user = await ctx.manager.authenticate(args);
            setLoggedInUser(ctx.req, user);
            ctx.user = user;
            ctx.authenticating = false;
            return user;
        }
    }
};
