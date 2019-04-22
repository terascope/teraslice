import * as React from 'react';
import ApolloClient from 'apollo-boost';
import { ApolloProvider } from 'react-apollo';
import blue from '@material-ui/core/colors/blue';
import blueGrey from '@material-ui/core/colors/blueGrey';
import { createMuiTheme, MuiThemeProvider } from '@material-ui/core';
import Users from './components/Users';
import AppNavBar from './components/AppNavBar';

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
            uri: 'http://localhost:8000/api/v2/data-access',
            headers: {
                Authorization: 'Basic YWRtaW46YWRtaW4=',
            },
        });
    }

    render() {
        return (
            <ApolloProvider client={this.createClient()}>
                <MuiThemeProvider theme={theme}>
                    <AppNavBar />
                    <Users />
                </MuiThemeProvider>
            </ApolloProvider>
        );
    }
}
