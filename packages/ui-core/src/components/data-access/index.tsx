import { PluginConfig } from '../core';
import UserForm from './users/Form';
import MyAccount from './users/MyAccount';
import ListUsers from './users/List';
import RoleForm from './roles/Form';
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
            actions: ['/users/create'],
        },
        {
            name: 'Create User',
            path: '/users/create',
            icon: 'add',
            hidden: true,
            component: UserForm,
        },
        {
            name: 'Edit User',
            path: '/users/edit/:id',
            icon: 'pencil alternate',
            hidden: true,
            component: UserForm,
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
            actions: ['/roles/create'],
        },
        {
            name: 'Create Role',
            path: '/roles/create',
            icon: 'add',
            hidden: true,
            component: UserForm,
        },
        {
            name: 'Edit Role',
            path: '/roles/edit/:id',
            icon: 'pencil alternate',
            hidden: true,
            component: RoleForm,
        },
    ],
};

export default config;
