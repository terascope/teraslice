import React from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import * as core from './components/core';
import * as framework from './components/framework';
import * as DataAccess from './components/data-access';

const { REACT_APP_DEV_MODE } = process.env;

const baseUri = REACT_APP_DEV_MODE ?  undefined : '/v2/ui';

export default class IndexRouter extends React.Component {
    static contextType = core.CoreContext;

    render() {
        const menus = [DataAccess.SidebarMenu];
        return (
            <Router basename={baseUri}>
                <framework.App menus={menus} >
                    <framework.Authenticate>
                        <core.ProtectedRoute path="/" component={framework.Welcome} exact />
                        <Route path="/logout" exact component={framework.Logout} />
                        <Route path="/login" exact component={framework.Login} />
                        <DataAccess.Routes />
                    </framework.Authenticate>
                </framework.App>
            </Router>
        );
    }
}
