require('./index.css');
import { PluginConfig, PluginService } from '@terascope/ui-components';
import userRoutes from './User/routes';
import roleRoutes from './Role/routes';
import dataTypeRoutes from './DataType/routes';

const registerFn = (): PluginConfig => {
    return {
        name: 'Data Access',
        basepath: '/',
        access: 'ADMIN',
        routes: [...userRoutes, ...roleRoutes, ...dataTypeRoutes],
    };
};

PluginService.register('data-access', registerFn);

export default registerFn;
