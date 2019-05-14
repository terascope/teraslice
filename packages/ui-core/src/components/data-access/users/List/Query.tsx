import React from 'react';
import gql from 'graphql-tag';
import { Query as ApolloQuery } from 'react-apollo';
import { stringify, parse } from 'query-string';
import { toNumber } from '@terascope/utils';
import {
    ErrorPage,
    QueryState,
    formatRegexQuery,
    ResolvedUser,
    tsWithRouter,
    UpdateQueryState,
} from '../../../core';

const searchFields = ['firstname', 'lastname', 'username', 'email'];

const ListQuery = tsWithRouter<Props>(({ history, location, children: Component }) => {
    const state: QueryState = Object.assign(
        {
            query: '*',
            size: 10,
        },
        parse(location.search)
    );

    if (state.size) state.size = toNumber(state.size);
    if (state.from) state.from = toNumber(state.from);

    const updateQueryState = (updates: QueryState) => {
        history.push({
            search: stringify({ ...state, ...updates }),
        });
    };

    const variables =
        state.query && state.query !== '*'
            ? {
                ...state,
                query: formatRegexQuery(state.query || '', searchFields),
            }
            : state;

    return (
        <Query query={QUERY} variables={variables}>
            {({ loading, error, data }) => {
                if (error) return <ErrorPage error={error} />;
                if (!data && !loading) {
                    return <ErrorPage error="Unexpected Error" />;
                }
                const records = (data && data.users) || [];
                const total = (data && data.usersCount) || 0;

                return (
                    <Component
                        queryState={state}
                        total={total}
                        loading={loading}
                        records={records}
                        updateQueryState={updateQueryState}
                    />
                );
            }}
        </Query>
    );
});

type ComponentProps = {
    queryState: QueryState;
    total: number;
    loading: boolean;
    records: any[];
    updateQueryState: UpdateQueryState;
};

type Props = {
    children: React.FC<ComponentProps>;
};

export default ListQuery;

// Query
const QUERY = gql`
    query Users($query: String, $from: Int, $size: Int, $sort: String) {
        users(query: $query, from: $from, size: $size, sort: $sort) {
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

class Query extends ApolloQuery<Response, QueryState> {}
