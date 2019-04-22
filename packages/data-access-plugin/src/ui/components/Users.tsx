import gql from 'graphql-tag';
import React from 'react';
import PropTypes from 'prop-types';
import { Query } from 'react-apollo';
import { AnyObject } from '@terascope/utils';
import Paper from '@material-ui/core/Paper';
import { Theme, createStyles, withStyles } from '@material-ui/core/styles';
import { ResolvedUser, QueryState } from '../interfaces';
import UsersTable from './UsersTable';

const styles = (theme: Theme) => createStyles({
    root: {
        margin: theme.spacing.unit * 2,
    },
});

type UsersProps = {
    query?: string;
    classes?: AnyObject;
};

class Users extends React.Component<UsersProps, QueryState> {
    static propTypes = {
        classes: PropTypes.object.isRequired,
    };

    static getDerivedStateFromProps(props, state) {
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
        const { classes } = this.props;
        const { sort, query, from, size = 1 } = this.state;

        return (
            <Paper className={classes.root}>
                <UsersQuery query={FIND_USERS} variables={{ sort, query, from, size }}>
                    {({ loading, error, data }) => {
                        if (loading) return 'Loading...';
                        if (error) return `Error! ${error.message}`;

                        return <UsersTable
                            users={data.users}
                            handleQueryChange={this.handleQueryChange}
                        />;
                    }}
                </UsersQuery>
            </Paper>
        );
    }
}

export default withStyles(styles)(Users);

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
    }
`;

interface Data {
    users: ResolvedUser[];
}

class UsersQuery extends Query<Data, QueryState> {}
