import { Role } from '@terascope/data-access';
import { ManagerContext } from '../interfaces';

export default {
    Role: {
        users(role: Role, args: any, ctx: ManagerContext) {
            const query = `role: ${role.id}`;
            return ctx.manager.findUsers({ query, size: 10000 }, ctx.user);
        },
        spaces(role: Role, args: any, ctx: ManagerContext) {
            const query = `roles: ${role.id}`;
            return ctx.manager.findSpaces({ query, size: 10000 }, ctx.user);
        },
    },
};
