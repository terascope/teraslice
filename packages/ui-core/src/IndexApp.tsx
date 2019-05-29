import React from 'react';
import ApolloClient from 'apollo-boost';
import { ApolloProvider } from 'react-apollo';
import { CoreContextProvider } from '@terascope/ui-components';
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
            <CoreContextProvider>
                <CoreRouter />
            </CoreContextProvider>
        </ApolloProvider>
    );
};

export default IndexApp;
