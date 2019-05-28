require('./index.css');
import { PluginConfig } from '@terascope/ui-components';
import usersRoutes from './User/routes';
import rolesRoutes from './Role/routes';
import dataTypesRoutes from './DataType/routes';

const config: PluginConfig = {
    name: 'Data Access',
    basepath: '/',
    access: 'ADMIN',
    routes: [...usersRoutes, ...rolesRoutes, ...dataTypesRoutes],
};

export default config;
