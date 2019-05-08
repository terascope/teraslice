import React from 'react';
import gql from 'graphql-tag';
import { Query } from 'react-apollo';
import { get } from '@terascope/utils';
import { ApolloError } from 'apollo-boost';
import { ResolvedUser } from '../../../helpers';
import { QueryState } from '../../core';

const CreateUserQuery: React.FC<Props> = ({ component: Component }) => {
    return (
        <CreateUserInfoQuery query={CREATE_USER_INFO_QUERY}>
            {({ loading, error, data }) => {
                const roles: Role[] = get(data, 'roles', []);
                const authUser = get(data, 'authenticate', {}) as ResolvedUser;

                return <Component
                    authUser={authUser}
                    roles={roles}
                    loading={loading}
                    error={error}
                />;
            }}
        </CreateUserInfoQuery>
    );
};

export type Role = {
    id: string;
    name: string;
};

export type ComponentProps = {
    roles: Role[];
    authUser: ResolvedUser;
    error?: ApolloError|Error|string;
    loading: boolean;
};

type Props = {
    component: React.FunctionComponent<ComponentProps>;
};

export default CreateUserQuery;

// Query
const CREATE_USER_INFO_QUERY = gql`
    {
        roles(query: "*") {
            id,
            name,
        },
        authenticate {
            username,
            client_id,
            type,
            role {
                id
            }
        }
    }
`;

interface Response {
    roles: Role[];
    authenticate: ResolvedUser;
}

class CreateUserInfoQuery extends Query<Response, QueryState> {}
