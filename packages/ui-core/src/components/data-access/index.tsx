import { PluginConfig } from '@terascope/ui-components';
import usersRoutes from './Users/routes';
import rolesRoutes from './Roles/routes';

const config: PluginConfig = {
    name: 'Data Access',
    basepath: '/',
    access: 'ADMIN',
    routes: [...usersRoutes, ...rolesRoutes],
};

export default config;
