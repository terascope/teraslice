import React, { useState } from 'react';
import gql from 'graphql-tag';
import { Query } from 'react-apollo';
import { Redirect } from 'react-router-dom';
import { Form, Button } from 'semantic-ui-react';
import { Page, useCoreContext, ResolvedUser, ErrorMessage } from '../core';
import { get } from '@terascope/utils';

type State = {
    username?: string;
    password?: string;
    redirectToReferrer?: boolean;
    ready?: boolean;
};

const Login: React.FC = (props: any) => {
    const { updateState } = useCoreContext();
    const [state, setState] = useState<State>({
        username: '',
        password: '',
        redirectToReferrer: false,
        ready: false,
    });

    if (state.redirectToReferrer) {
        const { from } = props.location.state || { from: { pathname: '/' } };
        return <Redirect to={from} />;
    }

    const { ready, username, password } = state;
    const variables: LoginVariables = { username, password };
    const onChange = (e: React.ChangeEvent, { name, value }: any) => {
        setState({ ...state, [name]: value, ready: false });
    };
    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setState({ ...state, ready: true });
    };

    return (
        <LoginQuery
            query={LOGIN}
            variables={variables}
            skip={!ready}
            onCompleted={data => {
                const authenticated = Boolean(get(data, 'authenticate.id'));
                const authUser = get(data, 'authenticate');
                updateState({ authenticated, authUser });
                setState({
                    ready: false,
                    redirectToReferrer: authenticated,
                });
            }}
            notifyOnNetworkStatusChange
        >
            {({ loading, error }) => {
                return (
                    <Page title="Login">
                        <Form onSubmit={onSubmit} className="coreForm">
                            <Form.Input
                                label="Username"
                                name="username"
                                required
                                value={username}
                                onChange={onChange}
                            />
                            <Form.Input
                                label="Password"
                                name="password"
                                type="password"
                                required
                                value={password}
                                onChange={onChange}
                            />
                            <Button type="submit" primary loading={loading}>
                                Submit
                            </Button>
                        </Form>
                        {error && (
                            <ErrorMessage error={error} attached="bottom" />
                        )}
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
            id
            client_id
            firstname
            lastname
            username
            email
            type
            api_token
            role {
                id
                name
            }
            updated
            created
        }
    }
`;

interface LoginVariables {
    username?: string;
    password?: string;
}

interface LoginResponse {
    authenticate: ResolvedUser;
}

class LoginQuery extends Query<LoginResponse, LoginVariables> {}
