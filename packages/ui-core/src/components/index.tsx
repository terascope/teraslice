import { PluginService } from '@terascope/ui-components';
import App from './App';
import Authenticate from './Authenticate';
import Login from './Login';
import Logout from './Logout';
import NoMatch from './NoMatch';
import ProtectedRoute from './ProtectedRoute';
import Routes from './Routes';
import Welcome from './Welcome';

PluginService.register('framework', () => {
    return {
        name: '',
        access: 'USER',
        routes: [
            {
                name: 'Home',
                path: '/',
                icon: 'home',
                component: Welcome,
            },
        ],
    };
});

export {
    App,
    Authenticate,
    Login,
    NoMatch,
    Logout,
    ProtectedRoute,
    Routes,
    Welcome,
};
