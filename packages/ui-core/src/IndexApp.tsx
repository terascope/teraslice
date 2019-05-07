import React from 'react';
import ApolloClient from 'apollo-boost';
import { ApolloProvider } from 'react-apollo';
import { CoreContextProvider } from './components/core';
import DataAccessPlugin from './components/data-access';
import CoreRouter from './IndexRouter';

const { REACT_APP_DEV_MODE } = process.env;

const apiPath = '/api/v2/data-access';
const apiUri = REACT_APP_DEV_MODE ? `http://localhost:8000${apiPath}` : apiPath;

export default class IndexApp extends React.Component {
    createClient() {
        return new ApolloClient({
            uri: apiUri,
            credentials: 'include',
        });
    }

    render() {
        const plugins = [DataAccessPlugin];

        return (
            <ApolloProvider client={this.createClient()}>
                <CoreContextProvider plugins={plugins}>
                    <CoreRouter />
                </CoreContextProvider>
            </ApolloProvider>
        );
    }
}
