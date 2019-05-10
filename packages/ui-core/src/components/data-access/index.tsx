import { PluginConfig } from '../core';
import CreateUser from './CreateUser';
import EditUser from './EditUser';
import ListUsers from './ListUsers';

const config: PluginConfig = {
    name: 'Data Access',
    basepath: '/users',
    routes: [
        {
            name: 'Users',
            path: '/',
            icon: 'users',
            exact: true,
            component: ListUsers,
        },
        {
            name: 'Create User',
            path: '/create',
            icon: 'plus',
            exact: true,
            hidden: true,
            component: CreateUser,
        },
        {
            name: 'Edit User',
            path: '/edit/:id',
            icon: 'pencil alternate',
            exact: true,
            hidden: true,
            component: EditUser,
        },
    ],
};

export default config;
