import { Space } from '@terascope/data-access';
import { ManagerContext } from '../interfaces';
import { findAll } from '../utils';

export default {
    Space: {
        roles(space: Space, args: any, ctx: ManagerContext) {
            return findAll(space.roles, query => ctx.manager.findRoles({ query }, ctx.user));
        },
        views(space: Space, args: any, ctx: ManagerContext) {
            return findAll(space.views, query => ctx.manager.findViews({ query }, ctx.user));
        },
        data_type(space: Space, args: any, ctx: ManagerContext) {
            if (!space.data_type) return null;
            return ctx.manager.findDataType({ id: space.data_type }, ctx.user);
        },
    },
};
