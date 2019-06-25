import { DataType } from '@terascope/data-access';
import { ManagerContext } from '../interfaces';

export default {
    DataType: {
        spaces(dataType: DataType, args: any, ctx: ManagerContext) {
            const query = `data_type: ${dataType.id}`;
            return ctx.manager.findSpaces({ query, size: 10000 }, ctx.user);
        },
        views(dataType: DataType, args: any, ctx: ManagerContext) {
            const query = `data_type: ${dataType.id}`;
            return ctx.manager.findViews({ query, size: 10000 }, ctx.user);
        },
        resolved_config(dataType: DataType, args: any, ctx: ManagerContext) {
            return ctx.manager.resolveDataTypeConfig({ dataType }, ctx.user);
        },
    },
};
