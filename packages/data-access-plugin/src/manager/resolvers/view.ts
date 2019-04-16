import { View } from '@terascope/data-access';
import { ManagerContext } from '../interfaces';

export default {
    View: {
        roles(view: View, args: any, ctx: ManagerContext) {
            if (!view.roles || !view.roles.length) return [];
            const query = `id: (${view.roles.join(' OR ')})`;
            return ctx.manager.findRoles({ query }, ctx.user);
        },
        data_type(view: View, args: any, ctx: ManagerContext) {
            if (!view.data_type) return null;
            return ctx.manager.findDataType({ id: view.data_type }, ctx.user);
        }
    }
};
