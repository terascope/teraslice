import React from 'react';
import gql from 'graphql-tag';
import PropTypes from 'prop-types';
import { Query } from 'react-apollo';
import { withStyles, Theme, createStyles } from '@material-ui/core/styles';
import Login from './Login';
import Loading from './Loading';
import ErrorPage from './ErrorPage';

const styles = (theme: Theme) => createStyles({
    root: {
        ...theme.mixins.gutters(),
        paddingTop: theme.spacing.unit * 2,
        paddingBottom: theme.spacing.unit * 2,
    },
});

type AuthenticateProps = {
    classes: any;
    authenticated: boolean;
    onLogin: () => void;
};

type AuthenticateState = {
};

class Authenticate extends React.Component<AuthenticateProps, AuthenticateState> {
    static propTypes = {
        classes: PropTypes.object.isRequired,
        onLogin: PropTypes.func.isRequired,
        authenticated: PropTypes.bool.isRequired,
    };

    state: AuthenticateState = {};

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
                    if (error) {
                        return <ErrorPage error={error} />;
                    }

                    if (data && !data.loggedIn) {
                        return <Login onLogin={this.props.onLogin} />;
                    }

                    return (
                        <div>
                            {children}
                        </div>
                    );
                }}
            </VerifyAuthQuery>
        );
    }
}

export default withStyles(styles)(Authenticate);

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
