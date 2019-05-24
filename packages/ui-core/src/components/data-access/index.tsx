import { PluginConfig } from '@terascope/ui-components';
import UserForm from './Users/Form';
import MyAccount from './Users/MyAccount';
import ListUsers from './Users/List';
import RoleForm from './Roles/Form';
import ListRoles from './Roles/List';
import { getModelConfig } from './config';

const usersConfig = getModelConfig('User');
const rolesConfig = getModelConfig('Role');

const config: PluginConfig = {
    name: 'Data Access',
    basepath: '/',
    access: 'ADMIN',
    routes: [
        {
            name: usersConfig.pluralLabel,
            path: `/${usersConfig.pathname}`,
            icon: 'users',
            component: ListUsers,
            actions: [`/${usersConfig.pathname}/create`],
        },
        {
            name: `Create ${usersConfig.singularLabel}`,
            path: `/${usersConfig.pathname}/create`,
            icon: 'add',
            hidden: true,
            component: UserForm,
        },
        {
            name: `Edit ${usersConfig.singularLabel}`,
            path: `/${usersConfig.pathname}/edit/:id`,
            icon: 'pencil alternate',
            hidden: true,
            component: UserForm,
        },
        {
            name: 'My Account',
            path: `/${usersConfig.pathname}/account`,
            icon: 'user circle',
            hidden: true,
            access: 'USER',
            component: MyAccount,
        },
        {
            name: `${rolesConfig.pluralLabel}`,
            path: `/${rolesConfig.pathname}`,
            icon: 'key',
            component: ListRoles,
            actions: [`/${rolesConfig.pathname}/create`],
        },
        {
            name: `Create ${rolesConfig.singularLabel}`,
            path: `/${rolesConfig.pathname}/create`,
            icon: 'add',
            hidden: true,
            component: RoleForm,
        },
        {
            name: `Edit ${rolesConfig.singularLabel}`,
            path: `/${rolesConfig.pathname}/edit/:id`,
            icon: 'pencil alternate',
            hidden: true,
            component: RoleForm,
        },
    ],
};

export default config;
