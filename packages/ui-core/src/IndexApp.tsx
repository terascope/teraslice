import React from 'react';
import ApolloClient from 'apollo-boost';
import { ApolloProvider } from 'react-apollo';
import { CoreContextProvider, PluginConfig } from '@terascope/ui-components';
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

    return (
        <ApolloProvider client={client}>
            <CoreContextProvider plugins={getRegisteredPlugins()}>
                <CoreRouter />
            </CoreContextProvider>
        </ApolloProvider>
    );
};

function getRegisteredPlugins(): PluginConfig[] {
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
    ];

    for (const key of Object.keys(window)) {
        if (key.startsWith('UIPlugin')) {
            // @ts-ignore
            const plugin = window[key].default || window[key];
            if (!plugin || !plugin.name) {
                console.error(`Invalid registered plugin window.${key}`);
            } else {
                console.debug(`Registered plugin ${key} ${plugin.name}`);
            }
            plugins.push(plugin);
        }
    }

    return plugins;
}

export default IndexApp;
