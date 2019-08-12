import React from 'react';
import gql from 'graphql-tag';
import { Redirect } from 'react-router-dom';
import { parseErrorInfo } from '@terascope/utils';
import { useQuery, useApolloClient } from 'react-apollo';
import {
    LoadingPage,
    ErrorPage,
    useCoreContext,
} from '@terascope/ui-components';

// Query...
const LOGOUT = gql`
    {
        logout
    }
`;

const Logout: React.FC = () => {
    const { authenticated, updateState } = useCoreContext();

    const client = useApolloClient();
    const { loading, error, data } = useQuery(LOGOUT, {
        skip: !authenticated,
        onCompleted: (result) => {
            updateState({
                authUser: undefined,
                authenticated: !(result && result.logout),
            });
            client.resetStore();
        },
        fetchPolicy: 'no-cache',
        notifyOnNetworkStatusChange: true,
    });

    if (!authenticated) return <Redirect to="/login" />;
    if (loading) return <LoadingPage />;

    const errMsg = parseErrorInfo(error).message;
    if (error && !errMsg.includes('400')) {
        return <ErrorPage error={error} />;
    }

    if (!data || !data.logout) {
        return <ErrorPage error="Unable to logout" />;
    }

    return <Redirect to="/login" />;
};

export default Logout;
