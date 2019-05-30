require('./index.css');
import { PluginService } from '@terascope/ui-components';
import dataTypeRoutes from './DataType/routes';
import userRoutes from './User/routes';
import roleRoutes from './Role/routes';
import viewRoutes from './View/routes';

PluginService.register('data-access', () => {
    return {
        name: 'Data Access',
        basepath: '/',
        access: 'ADMIN',
        routes: [...userRoutes, ...roleRoutes, ...dataTypeRoutes, ...viewRoutes],
    };
});
