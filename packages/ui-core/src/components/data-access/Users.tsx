import React from 'react';
import gql from 'graphql-tag';
import PropTypes from 'prop-types';
import { Query } from 'react-apollo';
import { Loading, ErrorInfo, Page } from '../core';
import { ResolvedUser, QueryState } from '../../helpers';
import UsersTable from './UsersTable';

type UsersProps = {
    query?: string;
};

class Users extends React.Component<UsersProps, QueryState> {
    static propTypes = {
        query: PropTypes.string,
    };

    static getDerivedStateFromProps(props: UsersProps, state: QueryState) {
        if (props.query) {
            return {
                ...state,
                query: props.query
            };
        }

        return state;
    }

    state: QueryState = {};

    handleQueryChange = (options: QueryState) => {
        this.setState({ ...options });
    }

    render() {
        const defaultRowsPerPage = 2;
        const { sort, query, from, size = defaultRowsPerPage } = this.state;

        const variables: QueryState = {
            query: query || '*',
            sort,
            from,
            size
        };

        return (
            <Page title="Users">
                <UsersQuery query={FIND_USERS} variables={variables}>
                    {({ loading, error, data }) => {
                        if (loading) return <Loading />;
                        if (error) return <ErrorInfo error={error} />;
                        if (!data) return <div>Uh oh</div>;

                        return <UsersTable
                            title="Users"
                            users={data.users}
                            total={data.usersCount}
                            query={query}
                            handleQueryChange={this.handleQueryChange}
                            defaultRowsPerPage={defaultRowsPerPage}
                        />;
                    }}
                </UsersQuery>
            </Page>
        );
    }
}

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
