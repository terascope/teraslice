import { PluginConfig } from '../core';
import CreateUser from './users/Create';
import EditUser from './users/Edit';
import MyAccount from './users/MyAccount';
import ListUsers from './users/List';
import CreateRole from './roles/Create';
import EditRole from './roles/Edit';
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
            icon: 'add',
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
            icon: 'user circle',
            hidden: true,
            component: MyAccount,
        },
        {
            name: 'Roles',
            path: '/roles',
            icon: 'key',
            component: ListRoles,
        },
        {
            name: 'Create Role',
            path: '/roles/create',
            icon: 'add',
            component: CreateRole,
        },
        {
            name: 'Edit Role',
            path: '/roles/edit/:id',
            icon: 'pencil alternate',
            hidden: true,
            component: EditRole,
        },
    ],
};

export default config;
