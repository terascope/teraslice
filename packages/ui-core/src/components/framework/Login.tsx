import React, { useState } from 'react';
import gql from 'graphql-tag';
import { Query } from 'react-apollo';
import { Redirect } from 'react-router-dom';
import { Form, Button } from 'semantic-ui-react';
import { Loading, ErrorInfo, Page, useCoreContext } from '../core';

type State = {
    username?: string;
    password?: string;
    redirectToReferrer?: boolean;
    ready?: boolean;
};

const Login: React.FC = (props: any) => {
    const { updateAuth } = useCoreContext();
    const [state, setState] = useState<State>({
        username: '',
        password: '',
        redirectToReferrer: false,
        ready: false
    });

    if (state.redirectToReferrer) {
        const { from } = props.location.state || { from: { pathname: '/' } };
        return <Redirect to={from} />;
    }

    const { ready, username, password } = state;
    const variables: LoginVariables = { username, password };

    return (
        <LoginQuery
            query={LOGIN}
            variables={variables}
            skip={!ready}
            onCompleted={(data) => {
                const authenticated = !!(data && data.authenticate.id);
                updateAuth(authenticated);
                setState({
                    ready: false,
                    redirectToReferrer: authenticated
                });
            }}
            notifyOnNetworkStatusChange
        >
            {({ loading, error }) => {
                if (loading) return <Loading />;
                if (error) return <ErrorInfo error={error} />;

                return (
                    <Page title="Login">
                        <Form onSubmit={() => {
                            setState({ ready: true });
                        }}>
                            <Form.Field
                                label="Username"
                                value={username}
                                onChange={(e: any, { value }: any) => {
                                    setState({ username: value, ready: false });
                                }}
                            />
                            <Form.Field
                                label="Password"
                                type="password"
                                value={password}
                                onChange={(e: any, { value }: any) => {
                                    setState({ password: value, ready: false });
                                }}
                            />
                            <Button type="submit" onClick={() => {
                                setState({ ready: true });
                            }}>
                                Login
                            </Button>
                        </Form>
                    </Page>
                );
            }}
        </LoginQuery>
    );
};

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
