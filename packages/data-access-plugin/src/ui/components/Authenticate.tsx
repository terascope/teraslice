import React from 'react';
import gql from 'graphql-tag';
import PropTypes from 'prop-types';
import { Query } from 'react-apollo';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import { withStyles, Theme, createStyles } from '@material-ui/core/styles';
import { ResolvedUser } from '../interfaces';
import Loading from './Loading';
import ErrorPage from './ErrorPage';
import { getErrorInfo } from '../utils';

const styles = (theme: Theme) => createStyles({
    root: {
        ...theme.mixins.gutters(),
        paddingTop: theme.spacing.unit * 2,
        paddingBottom: theme.spacing.unit * 2,
    },
});

type AuthenticateProps = {
    classes: any;
    onLogin: () => void;
};

type AuthenticateState = {
};

class Authenticate extends React.Component<AuthenticateProps, AuthenticateState> {
    static propTypes = {
        classes: PropTypes.object.isRequired,
        onLogin: PropTypes.func.isRequired,
    };

    state: AuthenticateState = {};

    render() {
        const { classes, children } = this.props;

        return (
            <AuthenticateQuery query={AUTHENTICATE}>
                {({ loading, error, data }) => {
                    if (loading) return <Loading />;
                    if (error) {
                        const { statusCode } = getErrorInfo(error);
                        if ([401, 403].includes(statusCode)) {
                            return (
                                <Paper className={classes.root} elevation={1}>
                                    <Typography variant="h4" component="h4" align="center">
                                        Login
                                    </Typography>
                                </Paper>
                            );
                        }

                        return <ErrorPage error={error} />;
                    }

                    return (
                        <div>
                            {children}
                        </div>
                    );
                }}
            </AuthenticateQuery>
        );
    }
}

export default withStyles(styles)(Authenticate);

// Query
const AUTHENTICATE = gql`
    {
        authenticate {
            id,
            firstname,
            lastname,
            username,
            email,
            role {
                id,
                name,
            }
            updated,
            created,
        }
    }
`;

interface Response {
    authenticate: ResolvedUser;
}

class AuthenticateQuery extends Query<Response, {}> {}
