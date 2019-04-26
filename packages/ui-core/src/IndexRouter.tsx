import React from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import { Welcome, Authenticate, App } from './components/framework';
import * as DataAccess from './components/data-access';

type State = {
    authenticated: boolean;
};

const { REACT_APP_DEV_MODE } = process.env;

const baseUri = REACT_APP_DEV_MODE ?  undefined : '/v2/ui';

export default class IndexRouter extends React.Component<{}, State> {
    state: State = {
        authenticated: false,
    };

    onLogout = () => {
        this.setState({ authenticated: false });
    }

    onLogin = () => {
        this.setState({ authenticated: true });
    }

    render() {
        const { authenticated } = this.state;

        const menus = [DataAccess.SidebarMenu];
        return (
            <Router basename={baseUri}>
                <App authenticated={authenticated} menus={menus} >
                    <Authenticate onLogin={this.onLogin} authenticated={authenticated}>
                        <Route path="/" exact component={Welcome} />
                        <DataAccess.Routes />
                    </Authenticate>
                </App>
            </Router>
        );
    }
}
