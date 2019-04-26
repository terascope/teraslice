import React from 'react';
import gql from 'graphql-tag';
import { Query } from 'react-apollo';
import { Loading, ErrorInfo, CoreContext } from '../core';

class Authenticate extends React.Component {
    static contextType = CoreContext;

    onCompleted = (data: VerifyResponse) => {
        this.context.updateAuth(data && data.loggedIn);
    }

    render() {
        const { children } = this.props;
        const { authenticated } = this.context;

        return (
            <VerifyAuthQuery
                query={AUTHENTICATE}
                skip={authenticated}
                onCompleted={this.onCompleted}
                notifyOnNetworkStatusChange
            >
                {({ loading, error }) => {
                    if (loading) return <Loading />;
                    if (error) return <ErrorInfo error={error} />;
                    return children;
                }}
            </VerifyAuthQuery>
        );
    }
}

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
