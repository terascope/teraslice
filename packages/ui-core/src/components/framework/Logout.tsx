import React from 'react';
import gql from 'graphql-tag';
import { Query } from 'react-apollo';
import { Redirect } from 'react-router';
import { parseErrorInfo } from '@terascope/utils';
import { withStyles, Theme, createStyles } from '@material-ui/core/styles';
import { Loading, ErrorInfo,  CoreContext } from '../core';
import { CoreProps, corePropTypes } from '../../helpers';

const styles = (theme: Theme) => createStyles({
    root: {
        ...theme.mixins.gutters(),
        paddingTop: theme.spacing.unit * 2,
        paddingBottom: theme.spacing.unit * 2,
    },
    container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
    },
    textField: {
        marginLeft: theme.spacing.unit,
        marginRight: theme.spacing.unit,
        width: 200,
    },
    button: {
        margin: theme.spacing.unit,
    },
});

class Logout extends React.Component<CoreProps> {
    static propTypes = {
        ...corePropTypes,
    };

    static contextType = CoreContext;

    render() {
        if (!this.context.authenticated) {
            return <Redirect to="/login" />;
        }

        return (
            <LogoutQuery
                query={LOGOUT}
                onCompleted={(data) => {
                    this.context.updateAuth(!(data && data.logout));
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
    }
}

export default withStyles(styles)(Logout);

// Query...
const LOGOUT = gql`
    {
        logout
    }
`;

interface LogoutResponse {
    logout: boolean;
}

class LogoutQuery extends Query <LogoutResponse,  {}> {}
