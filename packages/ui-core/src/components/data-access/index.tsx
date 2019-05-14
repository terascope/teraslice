import { PluginConfig } from '../core';
import CreateUser from './users/Create';
import EditUser from './users/Edit';
import MyAccount from './users/MyAccount';
import ListUsers from './users/List';
import ListRoles from './roles/List';

const config: PluginConfig = {
    name: 'Data Access',
    basepath: '/',
    routes: [
        {
            name: 'Users',
            path: '/users',
            icon: 'users',
            component: ListUsers,
        },
        {
            name: 'Create User',
            path: '/users/create',
            icon: 'add user',
            hidden: true,
            component: CreateUser,
        },
        {
            name: 'Edit User',
            path: '/users/edit/:id',
            icon: 'pencil alternate',
            hidden: true,
            component: EditUser,
        },
        {
            name: 'My Account',
            path: '/users/account',
            icon: 'pencil alternate',
            hidden: true,
            component: MyAccount,
        },
        {
            name: 'Roles',
            path: '/roles',
            icon: 'key',
            component: ListRoles,
        },
    ],
};

export default config;
