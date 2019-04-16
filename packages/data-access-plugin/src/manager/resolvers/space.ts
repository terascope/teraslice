import { Space } from '@terascope/data-access';
import { ManagerContext } from '../interfaces';

export default {
    Space: {
        roles(space: Space, args: any, ctx: ManagerContext) {
            if (!space.roles || !space.roles.length) return [];
            const query = `id: (${space.roles.join(' OR ')})`;
            return ctx.manager.findRoles({ query }, ctx.user);
        },
        views(space: Space, args: any, ctx: ManagerContext) {
            if (!space.views || !space.views.length) return [];
            const query = `id: (${space.views.join(' OR ')})`;
            return ctx.manager.findRoles({ query }, ctx.user);
        },
        data_type(space: Space, args: any, ctx: ManagerContext) {
            if (!space.data_type) return null;
            return ctx.manager.findDataType({ id: space.data_type }, ctx.user);
        }
    }
};
