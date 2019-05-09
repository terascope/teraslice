import { PluginConfig } from '../core';
import CreateUser from './CreateUser';
import ListUsers from './ListUsers';

const config: PluginConfig = {
    name: 'Data Access',
    routes: [
        {
            name: 'Users',
            path: '/users/',
            icon: 'users',
            component: ListUsers,
        },
        {
            name: 'Create User',
            path: '/users/create',
            icon: 'plus',
            hidden: true,
            component: CreateUser,
        },
    ],
};

export default config;
