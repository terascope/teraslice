import React from 'react';
import ApolloClient from 'apollo-boost';
import { ApolloProvider } from 'react-apollo';
import { get } from '@terascope/utils';
import { tsWithRouter, useCoreContext } from '@terascope/ui-components';

const { REACT_APP_DEV_MODE } = process.env;

const apiPath = '/api/v2/data-access';
const apiUri = REACT_APP_DEV_MODE ? `http://localhost:8000${apiPath}` : apiPath;

const ApolloWrapper = tsWithRouter(({ children, history }) => {
    const { updateState } = useCoreContext();

    const client = new ApolloClient({
        uri: apiUri,
        credentials: 'include',
        onError: ({ networkError, graphQLErrors }) => {
            if (networkError) {
                console.error(
                    'NetworkError',
                    JSON.parse(JSON.stringify(networkError))
                );
                const code = get(
                    networkError,
                    'result.errors[0].extensions.code'
                );
                if (code === 'UNAUTHENTICATED') {
                    updateState({
                        authUser: undefined,
                        authenticated: false,
                    });
                    client.resetStore();
                    history.replace('/login');
                }
            }
            if (graphQLErrors) {
                console.error(
                    'GraphQLErrors',
                    JSON.parse(JSON.stringify(graphQLErrors))
                );
            }
        },
    });

    // Enable dev tools for apollo client
    // @ts-ignore
    window.__APOLLO_CLIENT__ = client;
    return <ApolloProvider client={client}>{children}</ApolloProvider>;
});

export default ApolloWrapper;
