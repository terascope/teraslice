import React from 'react';
import ApolloClient from 'apollo-boost';
import { ApolloProvider } from 'react-apollo';
import AppRouter from './AppRouter';

const apiPath = '/api/v2/data-access';

export default class App extends React.Component {
    createClient() {
        return new ApolloClient({
            uri: process.env.REACT_APP_START_MODE ? `http://localhost:8000${apiPath}` : apiPath,
            credentials: 'include',
        });
    }

    render() {
        return (
            <ApolloProvider client={this.createClient()}>
                <AppRouter />
            </ApolloProvider>
        );
    }
}
