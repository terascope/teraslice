import React, { useState } from 'react';
import gql from 'graphql-tag';
import { Query } from 'react-apollo';
import { get } from '@terascope/utils';
import { ApolloError } from 'apollo-boost';
import { useCoreContext } from './CoreContext';
import { ResolvedUser } from './interfaces';
import LoadingPage from './LoadingPage';
import { tsWithRouter } from './utils';
import ErrorPage from './ErrorPage';

const AuthUserQuery = tsWithRouter(({ children, history }) => {
    const { updateState, authUser, authenticated } = useCoreContext();
    const [otherError, setOtherError] = useState<any>(null);
    if (otherError) return <ErrorPage error={otherError} />;

    return (
        <AuthQuery
            query={AUTH_QUERY}
            skip={authUser != null && authenticated}
            onCompleted={data => {
                updateState({
                    authUser: data.authenticate,
                    authenticated: true,
                });
            }}
            onError={error => {
                if (error && isAuthError(error)) {
                    history.replace('/logout');
                } else {
                    setOtherError(otherError);
                }
            }}
            notifyOnNetworkStatusChange
        >
            {({ loading }) => {
                if (loading) return <LoadingPage />;

                return children;
            }}
        </AuthQuery>
    );
});

function isAuthError(error: ApolloError) {
    const graphQLErrors = get(error, 'graphQLErrors');
    if (graphQLErrors && graphQLErrors.length) {
        const authErr = graphQLErrors.find(err => {
            if (!err || !err.path) return false;
            if (!err.path.includes('authenticate')) return false;
            return true;
        });
        const statusCode = get(authErr, 'extensions.exception.statusCode', 500);
        if (statusCode === 401) return true;
        return false;
    }
}

export default AuthUserQuery;

// Query
const AUTH_QUERY = gql`
    {
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

interface Response {
    authenticate: ResolvedUser;
}

class AuthQuery extends Query<Response> {}
