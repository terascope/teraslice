import React, { useState } from 'react';
import gql from 'graphql-tag';
import { History } from 'history';
import PropTypes from 'prop-types';
import { Query } from 'react-apollo';
import { get } from '@terascope/utils';
import { ApolloError } from 'apollo-boost';
import { withRouter } from 'react-router-dom';
import { ResolvedUser } from './interfaces';
import { useCoreContext } from './CoreContext';
import Loading from './Loading';
import ErrorInfo from './ErrorInfo';

const AuthUserQuery: React.FC<Props> = ({ children, history }) => {
    const { updateState, authUser, authenticated } = useCoreContext();
    const [otherError, setOtherError] = useState<any>(null);
    if (otherError) return <ErrorInfo error={otherError} />;

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
                if (loading) return <Loading />;

                return children;
            }}
        </AuthQuery>
    );
};

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

type Props = {
    history: History;
};

AuthUserQuery.propTypes = {
    history: PropTypes.any.isRequired,
};

export default withRouter(AuthUserQuery);

// Query
const AUTH_QUERY = gql`
    {
        authenticate {
            id
            firstname
            lastname
            username
            email
            type
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
