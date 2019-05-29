import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import {
    App,
    Authenticate,
    Login,
    Logout,
    NoMatch,
    Routes,
} from './components';

const IndexRouter: React.FC = () => {
    return (
        <Router basename={'/v2/ui'}>
            <App>
                <Switch>
                    <Route path="/logout" exact component={Logout} />
                    <Route path="/login" exact component={Login} />
                    <Authenticate>
                        <Routes />
                    </Authenticate>
                    <Route component={NoMatch} />
                </Switch>
            </App>
        </Router>
    );
};

export default IndexRouter;
