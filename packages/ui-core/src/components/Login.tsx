import React, { useState } from 'react';
import gql from 'graphql-tag';
import { useQuery } from 'react-apollo';
import { Redirect } from 'react-router-dom';
import { Form, Button } from 'semantic-ui-react';
import { Page, useCoreContext, ErrorMessage } from '@terascope/ui-components';
import { get } from '@terascope/utils';

type State = {
    username?: string;
    password?: string;
    redirectToReferrer?: boolean;
    ready?: boolean;
};

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

const Login: React.FC = (props: any) => {
    const { updateState } = useCoreContext();
    const [state, setState] = useState<State>({
        username: '',
        password: '',
        redirectToReferrer: false,
        ready: false,
    });

    const { ready, username, password } = state;
    const variables: LoginVariables = { username, password };
    const onChange = (e: React.ChangeEvent, { name, value }: any) => {
        setState({ ...state, [name]: value, ready: false });
    };
    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setState({ ...state, ready: true });
    };

    const { loading, error } = useQuery(LOGIN, {
        variables,
        skip: state.redirectToReferrer || !ready,
        onCompleted: (data) => {
            const authenticated = Boolean(get(data, 'authenticate.id'));
            const authUser = get(data, 'authenticate');
            updateState({ authenticated, authUser });
            setState({
                ready: false,
                redirectToReferrer: authenticated,
            });
        },
        fetchPolicy: 'network-only',
        notifyOnNetworkStatusChange: true,
    });

    if (state.redirectToReferrer) {
        const { from } = props.location.state || { from: { pathname: '/' } };
        return <Redirect to={from} />;
    }

    return (
        <Page title="Login">
            <Form onSubmit={onSubmit} className="loginForm">
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
            {error && <ErrorMessage error={error} attached="bottom" />}
      </Page>
    );
};

export default Login;

interface LoginVariables {
    username?: string;
    password?: string;
}
