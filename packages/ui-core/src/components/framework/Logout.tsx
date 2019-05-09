import React from 'react';
import gql from 'graphql-tag';
import { Query } from 'react-apollo';
import { Redirect } from 'react-router';
import { parseErrorInfo } from '@terascope/utils';
import { Loading, ErrorInfo, useCoreContext } from '../core';

const Logout: React.FC = () => {
    const { authenticated, updateState } = useCoreContext();
    if (!authenticated) return <Redirect to="/login" />;

    return (
        <LogoutQuery
            query={LOGOUT}
            onCompleted={data => {
                updateState({
                    authUser: undefined,
                    authenticated: !(data && data.logout),
                });
            }}
            notifyOnNetworkStatusChange
        >
            {({ loading, error, data }) => {
                if (loading) return <Loading />;

                const errMsg = parseErrorInfo(error).message;
                if (error && !errMsg.includes('400')) return <ErrorInfo error={error} />;

                if (!data || !data.logout) {
                    return <ErrorInfo error="Unable to logout" />;
                }

                return <Redirect to="/login" />;
            }}
        </LogoutQuery>
    );
};

export default Logout;

// Query...
const LOGOUT = gql`
    {
        logout
    }
`;

interface LogoutResponse {
    logout: boolean;
}

class LogoutQuery extends Query<LogoutResponse, {}> {}
