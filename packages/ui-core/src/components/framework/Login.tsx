import React from 'react';
import gql from 'graphql-tag';
import PropTypes from 'prop-types';
import { Query } from 'react-apollo';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import { withStyles, Theme, createStyles } from '@material-ui/core/styles';
import { Loading, ErrorInfo, Page } from '../core';
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

type LoginState = {
    username?: string;
    password?: string;
    ready?: boolean;
};

type LoginProps = CoreProps & {
    onLogin: () => void;
};

class Login extends React.Component<LoginProps, LoginState> {
    static propTypes = {
        ...corePropTypes,
        onLogin: PropTypes.func.isRequired,
    };

    state: LoginState = {
        username: '',
        password: '',
        ready: false
    };

    handleChange = (name: 'username'|'password') => (event: any) => {
        this.setState({
            [name]: event.target.value,
            ready: false,
        });
    }

    handleSubmit = () => {
        this.setState({ ready: true });
    }

    onCompleted = (data: LoginResponse) => {
        this.setState({ ready: false });
        if (data && data.authenticate.id) {
            this.props.onLogin();
        }
    }

    render() {
        const { classes } = this.props;
        const { username, password, ready } = this.state;

        const variables: LoginVariables = { username, password };
        return (
            <Page title="Login">
                <LoginQuery query={LOGIN} variables={variables} skip={!ready} onCompleted={this.onCompleted}>
                    {({ loading, error }) => {
                        if (loading) return <Loading />;
                        if (error) return <ErrorInfo error={error} />;

                        return (
                            <form className={classes.container}>
                                <TextField
                                    id="standard-name"
                                    label="Username"
                                    className={classes.textField}
                                    value={username}
                                    onChange={this.handleChange('username')}
                                    margin="normal"
                                />
                                <TextField
                                    id="standard-password-input"
                                    label="Password"
                                    className={classes.textField}
                                    type="password"
                                    value={password}
                                    onChange={this.handleChange('password')}
                                    margin="normal"
                                />
                                <Button color="primary" className={classes.button} onClick={this.handleSubmit}>
                                    Login
                                </Button>
                            </form>
                        );
                    }}
                </LoginQuery>
            </Page>
        );
    }
}

export default withStyles(styles)(Login);

// Query...
const LOGIN = gql`
    query Login($username: String, $password: String) {
        authenticate(username: $username, password: $password) {
             id,
        }
    }
`;

interface LoginVariables {
    username?: string;
    password?: string;
}

interface LoginResponse {
    authenticate: {
        id: string;
    };
}

class LoginQuery extends Query <LoginResponse,  LoginVariables> {}
