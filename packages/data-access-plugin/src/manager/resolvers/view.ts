import { View } from '@terascope/data-access';
import { ManagerContext } from '../interfaces';
import { findAll } from '../utils';
import { getFirst } from '@terascope/utils';

export default {
    View: {
        roles(view: View, args: any, ctx: ManagerContext) {
            return findAll(view.roles, query => ctx.manager.findRoles({ query }, ctx.user));
        },
        data_type(view: View, args: any, ctx: ManagerContext) {
            if (!view.data_type) return null;
            return ctx.manager.findDataType({ id: view.data_type }, ctx.user);
        },
        async space(view: View, args: any, ctx: ManagerContext) {
            const query = `views: ${view.id}`;
            const spaces = await ctx.manager.findSpaces({ query }, ctx.user);
            return getFirst(spaces);
        },
    },
};
