import React from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import { Welcome, Authenticate, AppWrapper } from './components/framework';
import DataAccess from './components/data-access';

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
                        <DataAccess />
                    </Authenticate>
                </AppWrapper>
            </Router>
        );
    }
}
