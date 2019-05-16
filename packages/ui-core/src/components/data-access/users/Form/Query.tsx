import React from 'react';
import gql from 'graphql-tag';
import PropTypes from 'prop-types';
import { Query } from 'react-apollo';
import { get } from '@terascope/utils';
import { Segment } from 'semantic-ui-react';
import * as i from './interfaces';
import {
    ErrorPage,
    LoadingPage,
    ResolvedUser,
    useCoreContext,
} from '../../../core';

const FormQuery: React.FC<Props> = ({ component: Component, id }) => {
    const QUERY = id ? WITH_ID_QUERY : WITHOUT_ID_QUERY;
    const authUser = useCoreContext().authUser!;

    return (
        <FetchQuery query={QUERY} variables={{ id }}>
            {({ loading, error, data }) => {
                const roles: i.Role[] = get(data, 'roles', []);

                if (loading) return <LoadingPage />;
                if (error) return <ErrorPage error={error} />;

                const input = getInput(authUser, data);

                return (
                    <Segment basic>
                        <Component roles={roles} input={input} id={id} />
                    </Segment>
                );
            }}
        </FetchQuery>
    );
};

function getInput(authUser: ResolvedUser, data: any): i.Input {
    const user = get(data, 'user');
    const input = {} as i.Input;
    for (const field of i.inputFields) {
        if (field === 'role') {
            input.role = get(user, 'role.id') || '';
        } else {
            input[field] = get(user, field) || '';
        }
    }
    if (!input.client_id && authUser.client_id) {
        input.client_id = authUser.client_id;
    }
    if (!input.type) input.type = 'USER';
    return input;
}

type Props = {
    id?: string;
    component: React.FunctionComponent<i.ComponentProps>;
};

FormQuery.propTypes = {
    component: PropTypes.func.isRequired,
    id: PropTypes.string,
};

export default FormQuery;

// Query
export const WITHOUT_ID_QUERY = gql`
    {
        roles(query: "*") {
            id
            name
        }
    }
`;

export const WITH_ID_QUERY = gql`
    query UserInfo($id: ID!) {
        roles(query: "*") {
            id
            name
        }
        user(id: $id) {
            id
            firstname
            lastname
            username
            email
            api_token
            role {
                id
                name
            }
            type
        }
    }
`;

interface Response {
    roles: i.Role[];
    user?: ResolvedUser;
}

interface Variables {
    id?: string;
}

class FetchQuery extends Query<Response, Variables> {}
