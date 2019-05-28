import { PluginRoute } from '@terascope/ui-components';
import config from './config';
import Form from './Form';
import List from './List';
import MyAccount from './MyAccount';

const routes: PluginRoute[] = [
    {
        name: config.pluralLabel,
        path: `/${config.pathname}`,
        icon: 'users',
        component: List,
        actions: [`/${config.pathname}/create`],
    },
    {
        name: `Create ${config.singularLabel}`,
        path: `/${config.pathname}/create`,
        icon: 'add',
        hidden: true,
        component: Form,
    },
    {
        name: `Edit ${config.singularLabel}`,
        path: `/${config.pathname}/edit/:id`,
        icon: 'pencil alternate',
        hidden: true,
        component: Form,
    },
    {
        name: 'My Account',
        path: `/${config.pathname}/account`,
        icon: 'user circle',
        hidden: true,
        access: 'USER',
        component: MyAccount,
    },
];

export default routes;
