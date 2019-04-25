import React from 'react';
import gql from 'graphql-tag';
import PropTypes from 'prop-types';
import { Query } from 'react-apollo';
import { Loading, ErrorInfo } from '../core';
import Login from './Login';

type AuthenticateProps = {
    authenticated: boolean;
    onLogin: () => void;
};

class Authenticate extends React.Component<AuthenticateProps> {
    static propTypes = {
        onLogin: PropTypes.func.isRequired,
        authenticated: PropTypes.bool.isRequired,
    };

    onCompleted = (data: VerifyResponse) => {
        if (data && data.loggedIn) {
            this.props.onLogin();
        }
    }

    render() {
        const { children, authenticated } = this.props;

        return (
            <VerifyAuthQuery
                query={AUTHENTICATE}
                skip={authenticated}
                onCompleted={this.onCompleted}
                notifyOnNetworkStatusChange
            >
                {({ loading, error, data }) => {
                    if (loading) return <Loading />;
                    if (error) return <ErrorInfo error={error} />;

                    if (data && !data.loggedIn) {
                        return <Login onLogin={this.props.onLogin} />;
                    }

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
