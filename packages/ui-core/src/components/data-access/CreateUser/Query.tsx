import React from 'react';
import gql from 'graphql-tag';
import { Query } from 'react-apollo';
import { get } from '@terascope/utils';
import { ApolloError } from 'apollo-boost';

const CreateUserQuery: React.FC<Props> = ({ component: Component }) => {
    return (
        <CreateUserInfoQuery query={CREATE_USER_INFO_QUERY}>
            {({ loading, error, data }) => {
                const roles: Role[] = get(data, 'roles', []);

                return <Component roles={roles} loading={loading} error={error} />;
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
    error?: ApolloError | Error | string;
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
            id
            name
        }
    }
`;

interface Response {
    roles: Role[];
}

class CreateUserInfoQuery extends Query<Response> {}
