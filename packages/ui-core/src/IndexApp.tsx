import React from 'react';
import ApolloClient from 'apollo-boost';
import { ApolloProvider } from 'react-apollo';
import { CoreContextProvider, PluginConfig } from '@terascope/ui-components';
import { Welcome } from './components/framework';
import CoreRouter from './IndexRouter';
import { isFunction } from '@terascope/utils';

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

    debugger;
    for (const key of Object.keys(window)) {
        if (key.startsWith('UIPlugin')) {
            // @ts-ignore
            const pluginFn = window[key].default || window[key];
            if (!pluginFn || !isFunction(pluginFn)) {
                console.error(
                    `Invalid registered plugin window.${key}`,
                    pluginFn
                );
            }

            try {
                const plugin = pluginFn();
                console.debug(`Registered plugin ${key} ${plugin.name}`);
                plugins.push(plugin);
            } catch (err) {
                console.error(`Error calling plugin ${key}`, err);
            }
        }
    }

    return plugins;
}

export default IndexApp;
