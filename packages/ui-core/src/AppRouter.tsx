import React from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import Welcome from './components/Welcome';
import Authenticate from './components/Authenticate';
import Users from './components/data-access/Users';
import AppWrapper from './components/AppWrapper';

type AppRouterState = {
    authenticated: boolean;
};

export default class AppRouter extends React.Component<{}, AppRouterState> {
    state: AppRouterState = {
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

        return (
            <Router>
                <AppWrapper authenticated={authenticated}>
                    <Authenticate onLogin={this.onLogin} authenticated={authenticated}>
                        <Route path="/" exact component={Welcome} />
                        <Route path="/users/" component={Users} />
                    </Authenticate>
                </AppWrapper>
            </Router>
        );
    }
}
