import Users from './Users';
import { PluginConfig } from '../core';

const config: PluginConfig = {
    name: 'Data Access',
    routes: [
        {
            name: 'Users',
            path: '/users/',
            icon: 'users',
            component: Users
        }
    ]
};

export default config;
