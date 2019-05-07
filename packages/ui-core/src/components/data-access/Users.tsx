import React, { useState } from 'react';
import gql from 'graphql-tag';
import { Query } from 'react-apollo';
import { DataTable, Loading, ErrorInfo, Page, RowMapping, QueryState } from '../core';
import { ResolvedUser, } from '../../helpers';

const rowMapping: RowMapping = {
    getId(data) { return data.id; },
    columns: {
        firstname: { label: 'First Name', format(data) { return data.firstname; } },
        lastname: { label: 'Last Name', format(data) { return data.lastname; } },
        username: { label: 'Username', format(data) { return data.username; } },
        role: { label: 'Role', format(data) { return data.role || data.type; } },
        created: { label: 'Created', format(data) { return data.created; } },
    }
};

const Users: React.FC = () => {
    const [state, setState] = useState<QueryState>({
        query: '*',
        size: 2
    });

    const updateQueryState = (queryState: QueryState) => {
        setState({ ...state, ...queryState });
    };

    return (
        <UsersQuery query={FIND_USERS} variables={state}>
            {({ loading, error, data }) => {
                if (loading) return <Loading />;
                if (error) return <ErrorInfo error={error} />;
                if (!data) return <ErrorInfo error="Unexpected Error" />;

                return (
                    <Page title="Users">
                        <DataTable
                            rowMapping={rowMapping}
                            title="Users"
                            data={data.users}
                            total={data.usersCount}
                            queryState={state}
                            updateQueryState={updateQueryState}
                        />;
                    </Page>
                );
            }}
        </UsersQuery>
    );
};

export default Users;

// Query
const FIND_USERS = gql`
    query Users($query: String, $from: Int, $size: Int, $sort: String) {
        users(query: $query, from: $from, size: $size, sort: $sort) {
            id,
            firstname,
            lastname,
            username,
            email,
            role {
                id,
                name,
            }
            updated,
            created,
        }
        usersCount(query: $query)
    }
`;

interface Response {
    users: ResolvedUser[];
    usersCount: number;
}

class UsersQuery extends Query<Response, QueryState> {}
