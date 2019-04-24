import React from 'react';
import gql from 'graphql-tag';
import PropTypes from 'prop-types';
import { Query } from 'react-apollo';
import { Form, Button, InputOnChangeData } from 'semantic-ui-react';
import { Loading, ErrorInfo, Page } from '../ui-components';

type LoginState = {
    username?: string;
    password?: string;
    ready?: boolean;
};

type LoginProps = {
    onLogin: () => void;
};

class Login extends React.Component<LoginProps, LoginState> {
    static propTypes = {
        onLogin: PropTypes.func.isRequired,
    };

    state: LoginState = {
        username: '',
        password: '',
        ready: false
    };

    handleChange = (event: any, { name, value }: InputOnChangeData) => {
        this.setState({
            [name]: value,
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
        const { username, password, ready } = this.state;

        const variables: LoginVariables = { username, password };
        return (
            <Page title="Login">
                <LoginQuery query={LOGIN} variables={variables} skip={!ready} onCompleted={this.onCompleted}>
                    {({ loading, error }) => {
                        if (loading) return <Loading />;
                        if (error) return <ErrorInfo error={error} />;

                        return (
                            <Form onSubmit={this.handleSubmit}>
                                <Form.Input
                                    label="Username"
                                    name="username"
                                    value={username}
                                    onChange={this.handleChange}
                                    required={true}
                                />
                                <Form.Input
                                    label="Password"
                                    name="password"
                                    type="password"
                                    value={password}
                                    onChange={this.handleChange}
                                    required={true}
                                />
                                <Button type="submit">Submit</Button>
                            </Form>
                        );
                    }}
                </LoginQuery>
            </Page>
        );
    }
}

export default Login;

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
