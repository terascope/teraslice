import React from 'react';
import gql from 'graphql-tag';
import PropTypes from 'prop-types';
import { Query } from 'react-apollo';
import { get, withoutNil, isString } from '@terascope/utils';
import { User } from '@terascope/data-access';
import { Segment } from 'semantic-ui-react';
import { ErrorInfo, Loading, ResolvedUser, useCoreContext } from '../../core';

const UserQuery: React.FC<Props> = ({ component: Component, id }) => {
    const QUERY = id ? USER_AND_ROLES_QUERY : ROLES_QUERY;
    const authUser = useCoreContext().authUser!;

    return (
        <UserInfoQuery query={QUERY} variables={{ id }}>
            {({ loading, error, data }) => {
                const roles: Role[] = get(data, 'roles', []);
                const initUser: Partial<ResolvedUser> = Object.assign(
                    withoutNil({
                        id,
                        client_id: authUser.client_id || 0,
                        firstname: '',
                        lastname: '',
                        username: '',
                        // @ts-ignore
                        password: '',
                        email: '',
                        role: authUser.role,
                        type: 'USER',
                    }),
                    withoutNil(get(data, 'user', {}))
                );
                if (!isString(initUser.role)) {
                    initUser.role = get(initUser, 'role.id');
                }

                if (loading) return <Loading />;
                if (error) return <ErrorInfo error={error} />;

                return (
                    <Segment basic>
                        <Component roles={roles} initUser={initUser} id={id} />
                    </Segment>
                );
            }}
        </UserInfoQuery>
    );
};

export type Role = {
    id: string;
    name: string;
};

export type ComponentProps = {
    roles: Role[];
    initUser: Partial<User>;
    id?: string;
};

export const ComponentPropTypes = {
    roles: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            name: PropTypes.string.isRequired,
        }).isRequired
    ).isRequired,
    id: PropTypes.string,
    initUser: PropTypes.object.isRequired,
};

type Props = {
    id?: string;
    component: React.FunctionComponent<ComponentProps>;
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
            firstname
            lastname
            username
            email
            role {
                id
                name
            }
            type
            updated
            created
        }
    }
`;

interface Response {
    roles: Role[];
    user?: ResolvedUser;
}

interface Variables {
    id?: string;
}

class UserInfoQuery extends Query<Response, Variables> {}
