import React from 'react';
import gql from 'graphql-tag';
import { Query, ApolloConsumer } from 'react-apollo';
import { stringify, parse } from 'query-string';
import { get, toNumber } from '@terascope/utils';
import {
    DataTable,
    ErrorPage,
    Page,
    RowMapping,
    QueryState,
    formatRegexQuery,
    PageAction,
    ResolvedUser,
    useCoreContext,
    tsWithRouter,
} from '../core';

const searchFields = ['firstname', 'lastname', 'username', 'email'];

const ListUsers = tsWithRouter(({ history, location }) => {
    const authUser = useCoreContext().authUser!;

    const state: QueryState = Object.assign(
        {
            query: '*',
            size: 10,
        },
        parse(location.search)
    );
    if (state.size) state.size = toNumber(state.size);
    if (state.from) state.from = toNumber(state.from);

    const rowMapping: RowMapping = {
        getId(record) {
            return record.id;
        },
        canRemove(record) {
            if (record.type === 'SUPERADMIN') return false;
            if (record.id === authUser.id) return false;
            return true;
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

    const updateQueryState = (updates: QueryState) => {
        history.push({
            search: stringify({ ...state, ...updates }),
        });
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
                if (error) return <ErrorPage error={error} />;
                if (!data && !loading) return <ErrorPage error="Unexpected Error" />;
                const records = (data && data.users) || [];
                const total = (data && data.usersCount) || 0;

                return (
                    <ApolloConsumer>
                        {(client) => (
                            <Page title="Users" actions={actions}>
                                <DataTable
                                    rowMapping={rowMapping}
                                    title="Users"
                                    baseEditPath="/users/edit"
                                    removeRecords={async (ids) => {
                                        if (ids === true) {
                                            throw new Error(
                                                'Removing all users in not supported yet'
                                            );
                                        }

                                        const promises = ids.map((id) => {
                                            return client.mutate({
                                                mutation: REMOVE_QUERY,
                                                variables: {
                                                    id,
                                                },
                                            });
                                        });

                                        await Promise.all(promises);

                                        return `Successful deleted ${ids.length} records`;
                                    }}
                                    loading={loading}
                                    records={records}
                                    total={total}
                                    queryState={state}
                                    updateQueryState={updateQueryState}
                                />
                            </Page>
                        )}
                    </ApolloConsumer>
                );
            }}
        </UsersQuery>
    );
});

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

const REMOVE_QUERY = gql`
    mutation RemoveUser($id: ID!) {
        removeUser(id: $id)
    }
`;
