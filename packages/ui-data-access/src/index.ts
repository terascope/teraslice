require('./index.css');
import { PluginConfig, PluginService } from '@terascope/ui-components';
import dataTypeRoutes from './DataType/routes';
import userRoutes from './User/routes';
import roleRoutes from './Role/routes';
import viewRoutes from './View/routes';

const registerFn = (): PluginConfig => {
    return {
        name: 'Data Access',
        basepath: '/',
        access: 'ADMIN',
        routes: [...userRoutes, ...roleRoutes, ...dataTypeRoutes, ...viewRoutes],
    };
};

PluginService.register('data-access', registerFn);

export default registerFn;
