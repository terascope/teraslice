import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import * as framework from './components/framework';

const IndexRouter: React.FC = () => {
    return (
        <Router basename={'/v2/ui'}>
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
