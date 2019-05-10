import React, { useState } from 'react';
import gql from 'graphql-tag';
import { Query } from 'react-apollo';
import { get } from '@terascope/utils';
import {
    DataTable,
    ErrorInfo,
    Page,
    RowMapping,
    QueryState,
    formatRegexQuery,
    PageAction,
    ResolvedUser,
} from '../core';

const rowMapping: RowMapping = {
    getId(data) {
        return data.id;
    },
    columns: {
        username: { label: 'Username' },
        firstname: { label: 'First Name' },
        lastname: { label: 'Last Name' },
        role: {
            label: 'Role',
            format(data) {
                return get(data, 'role.name') || data.type;
            },
        },
        created: { label: 'Created' },
    },
};

const searchFields = ['firstname', 'lastname', 'username', 'email'];

const ListUsers: React.FC = () => {
    const [state, setState] = useState<QueryState>({
        query: '*',
        size: 10,
    });

    const updateQueryState = (queryState: QueryState) => {
        setState({ ...state, ...queryState });
    };

    const actions: PageAction[] = [
        {
            label: 'Create user',
            icon: 'plus',
            to: '/users/create',
        },
    ];

    const variables =
        state.query && state.query !== '*'
            ? {
                ...state,
                query: formatRegexQuery(state.query || '', searchFields),
            }
            : state;

    return (
        <UsersQuery query={FIND_USERS} variables={variables}>
            {({ loading, error, data }) => {
                if (error) return <ErrorInfo error={error} />;
                if (!data && !loading) return <ErrorInfo error="Unexpected Error" />;
                const records = (data && data.users) || [];
                const total = (data && data.usersCount) || 0;

                return (
                    <Page title="Users" actions={actions}>
                        <DataTable
                            rowMapping={rowMapping}
                            title="Users"
                            baseEditPath="/users/edit"
                            removeRecords={() => {}}
                            loading={loading}
                            records={records}
                            total={total}
                            queryState={state}
                            updateQueryState={updateQueryState}
                        />
                    </Page>
                );
            }}
        </UsersQuery>
    );
};

export default ListUsers;

// Query
const FIND_USERS = gql`
    query Users($query: String, $from: Int, $size: Int, $sort: String) {
        users(query: $query, from: $from, size: $size, sort: $sort) {
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
        usersCount(query: $query)
    }
`;

interface Response {
    users: ResolvedUser[];
    usersCount: number;
}

class UsersQuery extends Query<Response, QueryState> {}
