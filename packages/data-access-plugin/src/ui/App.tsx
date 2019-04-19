import * as React from 'react';
import ApolloClient from 'apollo-boost';
import { ApolloProvider } from 'react-apollo';
import blue from '@material-ui/core/colors/blue';
import blueGrey from '@material-ui/core/colors/blueGrey';
import { createMuiTheme, MuiThemeProvider } from '@material-ui/core';
import AppNavBar from './components/AppNavBar';

const client = new ApolloClient();

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
    public render() {
        return (
            <ApolloProvider client={client}>
                <MuiThemeProvider theme={theme}>
                    <AppNavBar />
                </MuiThemeProvider>
            </ApolloProvider>
        );
    }
}
