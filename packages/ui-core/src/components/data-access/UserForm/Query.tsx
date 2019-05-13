import React from 'react';
import gql from 'graphql-tag';
import PropTypes from 'prop-types';
import { Query } from 'react-apollo';
import { get } from '@terascope/utils';
import { Segment } from 'semantic-ui-react';
import * as i from './interfaces';
import { ErrorPage, LoadingPage, ResolvedUser, useCoreContext } from '../../core';

const UserQuery: React.FC<Props> = ({ component: Component, id }) => {
    const QUERY = id ? USER_AND_ROLES_QUERY : ROLES_QUERY;
    const authUser = useCoreContext().authUser!;

    return (
        <UserInfoQuery query={QUERY} variables={{ id }}>
            {({ loading, error, data }) => {
                const roles: i.Role[] = get(data, 'roles', []);

                if (loading) return <LoadingPage />;
                if (error) return <ErrorPage error={error} />;

                const userInput = getUserInput(authUser, get(data, 'user'));

                return (
                    <Segment basic>
                        <Component roles={roles} userInput={userInput} id={id} />
                    </Segment>
                );
            }}
        </UserInfoQuery>
    );
};

function getUserInput(authUser: ResolvedUser, user: any = {}): i.UserInput {
    const userInput = {} as i.UserInput;
    for (const field of i.userInputFields) {
        if (field === 'role') {
            userInput.role = get(user, 'role.id') || '';
        } else {
            userInput[field] = get(user, field) || '';
        }
    }
    if (!userInput.client_id) {
        userInput.client_id = authUser.client_id || 0;
    }
    if (!userInput.type) userInput.type = 'USER';
    return userInput;
}

type Props = {
    id?: string;
    component: React.FunctionComponent<i.ComponentProps>;
};

UserQuery.propTypes = {
    component: PropTypes.func.isRequired,
    id: PropTypes.string,
};

export default UserQuery;

// Query
const ROLES_QUERY = gql`
    {
        roles(query: "*") {
            id
            name
        }
    }
`;

const USER_AND_ROLES_QUERY = gql`
    query UserInfo($id: ID!) {
        roles(query: "*") {
            id
            name
        }
        user(id: $id) {
            id
            client_id
            firstname
            lastname
            username
            email
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

class UserInfoQuery extends Query<Response, Variables> {}
