import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import * as framework from './components/framework';

const { REACT_APP_DEV_MODE } = process.env;

const baseUri = REACT_APP_DEV_MODE ? undefined : '/v2/ui';

const IndexRouter: React.FC = () => {
    return (
        <Router basename={baseUri}>
            <framework.App>
                <Switch>
                    <Route path="/logout" exact component={framework.Logout} />
                    <Route path="/login" exact component={framework.Login} />
                    <framework.Authenticate>
                        <framework.Routes />
                    </framework.Authenticate>
                    <Route component={framework.NoMatch} />
                </Switch>
            </framework.App>
        </Router>
    );
};

export default IndexRouter;
