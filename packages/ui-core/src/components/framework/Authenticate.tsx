import React from 'react';
import gql from 'graphql-tag';
import { Query } from 'react-apollo';
import {
    Loading,
    ErrorInfo,
    useCoreContext
} from '../core';

const Authenticate: React.FC = ({ children }) => {
    const { updateAuth, authenticated } = useCoreContext();

    return (
        <VerifyAuthQuery
            query={AUTHENTICATE}
            skip={authenticated}
            onCompleted={(data) => {
                updateAuth(data && data.loggedIn);
            }}
            notifyOnNetworkStatusChange
        >
            {({ loading, error }) => {
                if (loading) return <Loading />;
                if (error) return <ErrorInfo error={error} />;
                return children;
            }}
        </VerifyAuthQuery>
    );
};

export default Authenticate;

// Query
const AUTHENTICATE = gql`
    {
        loggedIn
    }
`;

interface VerifyResponse {
    loggedIn: boolean;
}

class VerifyAuthQuery extends Query<VerifyResponse, {}> {}
