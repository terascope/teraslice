import React, { useState } from 'react';
import gql from 'graphql-tag';
import { Query } from 'react-apollo';
import { get } from '@terascope/utils';
import { ResolvedUser, } from '../../helpers';
import {
    DataTable,
    Loading,
    ErrorInfo,
    Page,
    RowMapping,
    QueryState,
    formatRegexQuery
} from '../core';

const rowMapping: RowMapping = {
    getId(data) { return data.id; },
    columns: {
        firstname: { label: 'First Name' },
        lastname: { label: 'Last Name' },
        username: { label: 'Username' },
        role: { label: 'Role', format(data) { return get(data, 'role.name') || data.type; } },
        created: { label: 'Created' },
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

    const searchFields = ['firstname', 'lastname', 'username', 'email'];

    const variables = state.query && state.query !== '*'
        ? {
            ...state,
            query: formatRegexQuery(state.query || '', searchFields)
        } : state;

    return (
        <UsersQuery query={FIND_USERS} variables={variables}>
            {({ loading, error, data }) => {
                if (loading) return <Loading />;
                if (error) return <ErrorInfo error={error} />;
                if (!data) return <ErrorInfo error="Unexpected Error" />;

                return (
                    <Page title="Users">
                        <DataTable
                            rowMapping={rowMapping}
                            title="Users"
                            removeRecords={() => {}}
                            records={data.users}
                            total={data.usersCount}
                            queryState={state}
                            updateQueryState={updateQueryState}
                        />
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
