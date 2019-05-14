import { PluginConfig } from '../core';
import CreateUser from './users/Create';
import EditUser from './users/Edit';
import MyAccount from './users/MyAccount';
import ListUsers from './users/List';

const config: PluginConfig = {
    name: 'Data Access',
    basepath: '/users',
    routes: [
        {
            name: 'Users',
            path: '/',
            icon: 'users',
            component: ListUsers,
        },
        {
            name: 'Create User',
            path: '/create',
            icon: 'plus',
            hidden: true,
            component: CreateUser,
        },
        {
            name: 'Edit User',
            path: '/edit/:id',
            icon: 'pencil alternate',
            hidden: true,
            component: EditUser,
        },
        {
            name: 'My Account',
            path: '/account',
            icon: 'pencil alternate',
            hidden: true,
            component: MyAccount,
        },
    ],
};

export default config;
