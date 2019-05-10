import { PluginConfig } from '../core';
import CreateUser from './CreateUser';
import EditUser from './EditUser';
import ListUsers from './ListUsers';

const config: PluginConfig = {
    name: 'Data Access',
    routes: [
        {
            name: 'Users',
            path: '/users/',
            icon: 'users',
            exact: true,
            component: ListUsers,
        },
        {
            name: 'Create User',
            path: '/users/create',
            icon: 'plus',
            exact: true,
            hidden: true,
            component: CreateUser,
        },
        {
            name: 'Edit User',
            path: '/users/edit/:id',
            icon: 'pencil alternate',
            exact: false,
            hidden: true,
            component: EditUser,
        },
    ],
};

export default config;
