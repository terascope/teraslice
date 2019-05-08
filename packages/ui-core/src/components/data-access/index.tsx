import ListUsers from './ListUsers';
import { PluginConfig } from '../core';

const config: PluginConfig = {
    name: 'Data Access',
    routes: [
        {
            name: 'Users',
            path: '/users/',
            icon: 'users',
            component: ListUsers
        }
    ]
};

export default config;
