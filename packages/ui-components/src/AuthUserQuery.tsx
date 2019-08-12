import React, { useState } from 'react';
import gql from 'graphql-tag';
import { useQuery } from 'react-apollo';
import { get } from '@terascope/utils';
import { ApolloError } from 'apollo-boost';
import { useCoreContext } from './CoreContext';
import LoadingPage from './LoadingPage';
import { tsWithRouter } from './utils';
import ErrorPage from './ErrorPage';

// Query
export const AUTH_QUERY = gql`
    query AuthQuery {
        authenticate {
            id
            client_id
            firstname
            lastname
            username
            email
            type
            api_token
            role {
                id
                name
            }
            updated
            created
        }
    }
`;

const AuthUserQuery = tsWithRouter(({ children, history }) => {
    const { updateState, authUser, authenticated } = useCoreContext();
    const [otherError, setOtherError] = useState<any>(null);
    const { loading } = useQuery(AUTH_QUERY, {
        skip: otherError == null && authUser != null && authenticated,
        onCompleted: (data) => {
            updateState({
                authUser: data.authenticate,
                authenticated: true,
            });
        },
        onError: (error) => {
            if (error && isAuthError(error)) {
                history.replace('/logout');
            } else {
                setOtherError(otherError);
            }
        },
        fetchPolicy: 'network-only',
        notifyOnNetworkStatusChange: true,
    });

    if (otherError) return <ErrorPage error={otherError} />;
    if (loading) return <LoadingPage />;

    return <React.Fragment>{children}</React.Fragment>;
});

function isAuthError(error: ApolloError) {
    const graphQLErrors = get(error, 'graphQLErrors');
    if (graphQLErrors && graphQLErrors.length) {
        const authErr = graphQLErrors.find((err) => {
            if (!err || !err.path) return false;
            if (!err.path.includes('authenticate')) return false;
            return true;
        });
        const statusCode = get(authErr, 'extensions.exception.statusCode', 500);
        if (statusCode === 401) return true;
        return false;
    }
    return undefined;
}

export default AuthUserQuery;
