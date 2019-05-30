require('./index.css');
import { PluginService } from '@terascope/ui-components';
import dataTypeRoutes from './DataType/routes';
import roleRoutes from './Role/routes';
import spaceRoutes from './Space/routes';
import userRoutes from './User/routes';
import viewRoutes from './View/routes';

PluginService.register('data-access', () => {
    return {
        name: 'Data Access',
        basepath: '/',
        access: 'ADMIN',
        routes: [...dataTypeRoutes, ...roleRoutes, ...spaceRoutes, ...userRoutes, ...viewRoutes],
    };
});
