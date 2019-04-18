import { User } from '@terascope/data-access';
import { ManagerContext } from '../interfaces';

export default {
    User: {
        role(user: User, args: any, ctx: ManagerContext) {
            if (!user.role) return null;
            return ctx.manager.findRole({ id: user.role }, ctx.user);
        }
    }
};
