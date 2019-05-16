import React from 'react';
import ApolloClient from 'apollo-boost';
import { ApolloProvider } from 'react-apollo';
import { CoreContextProvider, PluginConfig } from './components/core';
import DataAccessPlugin from './components/data-access';
import { Welcome } from './components/framework';
import CoreRouter from './IndexRouter';

const { REACT_APP_DEV_MODE } = process.env;

const apiPath = '/api/v2/data-access';
const apiUri = REACT_APP_DEV_MODE ? `http://localhost:8000${apiPath}` : apiPath;

const IndexApp: React.FC = () => {
    const client = new ApolloClient({
        uri: apiUri,
        credentials: 'include',
    });

    const plugins: PluginConfig[] = [
        {
            name: '',
            access: 'USER',
            routes: [
                {
                    name: 'Home',
                    path: '/',
                    icon: 'home',
                    component: Welcome,
                },
            ],
        },
        DataAccessPlugin,
    ];

    return (
        <ApolloProvider client={client}>
            <CoreContextProvider plugins={plugins}>
                <CoreRouter />
            </CoreContextProvider>
        </ApolloProvider>
    );
};

export default IndexApp;
