import React from 'react';
import ApolloClient from 'apollo-boost';
import { ApolloProvider } from 'react-apollo';
import { MuiThemeProvider } from '@material-ui/core';
import { theme } from './core';
import CoreRouter from './IndexRouter';

const apiPath = '/api/v2/data-access';

export default class IndexApp extends React.Component {
    createClient() {
        return new ApolloClient({
            uri: process.env.REACT_APP_START_MODE ? `http://localhost:8000${apiPath}` : apiPath,
            credentials: 'include',
        });
    }

    render() {
        return (
            <ApolloProvider client={this.createClient()}>
                <MuiThemeProvider theme={theme}>
                    <CoreRouter />
                </MuiThemeProvider>
            </ApolloProvider>
        );
    }
}
