import React from 'react';
import ApolloClient from 'apollo-boost';
import { ApolloProvider } from 'react-apollo';
import blue from '@material-ui/core/colors/blue';
import blueGrey from '@material-ui/core/colors/blueGrey';
import { createMuiTheme, MuiThemeProvider } from '@material-ui/core';
import AppRouter from './AppRouter';

const apiPath = '/api/v2/data-access';

const theme = createMuiTheme({
    typography: {
        useNextVariants: true
    },
    palette: {
        primary: blue,
        secondary: blueGrey
    }
});

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
                <MuiThemeProvider theme={theme}>
                    <AppRouter />
                </MuiThemeProvider>
            </ApolloProvider>
        );
    }
}
