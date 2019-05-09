import { ErrorInfo, Loading } from '../../core';

import { Query } from 'react-apollo';
import React from 'react';
import { Segment } from 'semantic-ui-react';
import { get } from '@terascope/utils';
import gql from 'graphql-tag';

const CreateUserQuery: React.FC<Props> = ({ component: Component }) => {
    return (
        <CreateUserInfoQuery query={CREATE_USER_INFO_QUERY}>
            {({ loading, error, data }) => {
                const roles: Role[] = get(data, 'roles', []);
                if (loading) return <Loading />;
                if (error) return <ErrorInfo error={error} />;

                return (
                    <Segment basic>
                        <Component roles={roles} />
                    </Segment>
                );
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
