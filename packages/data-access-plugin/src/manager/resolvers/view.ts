import { View } from '@terascope/data-access';
import { ManagerContext } from '../interfaces';
import { findAll } from '../utils';

export default {
    View: {
        roles(view: View, args: any, ctx: ManagerContext) {
            return findAll(view.roles, (query) => ctx.manager.findRoles({ query }, ctx.user));
        },
        data_type(view: View, args: any, ctx: ManagerContext) {
            if (!view.data_type) return null;
            return ctx.manager.findDataType({ id: view.data_type }, ctx.user);
        }
    }
};
