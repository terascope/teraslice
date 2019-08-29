import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import ApolloWrapper from './ApolloWrapper';
import {
    App,
    Authenticate,
    Login,
    Logout,
    NoMatch,
    Routes,
} from './components';

const IndexRouter: React.FC = () => (
    <Router basename="/v2/ui">
        <ApolloWrapper>
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
        </ApolloWrapper>
    </Router>
);

export default IndexRouter;
