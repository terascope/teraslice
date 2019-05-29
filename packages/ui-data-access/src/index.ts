require('./index.css');
import { PluginConfig } from '@terascope/ui-components';

export default () => {
    const usersRoutes = require('./User/routes');
    const rolesRoutes = require('./Role/routes');
    const dataTypesRoutes = require('./DataType/routes');

    const config: PluginConfig = {
        name: 'Data Access',
        basepath: '/',
        access: 'ADMIN',
        routes: [...usersRoutes, ...rolesRoutes, ...dataTypesRoutes],
    };

    return config;
};
