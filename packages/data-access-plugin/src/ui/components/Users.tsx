import React from 'react';
import gql from 'graphql-tag';
import PropTypes from 'prop-types';
import { Query } from 'react-apollo';
import List from '@material-ui/core/List';
import { User } from '@terascope/data-access';
import { withStyles } from '@material-ui/core';
import UserListItem from './UserListItem';

const styles = theme => ({
    root: {
        width: '100%',
        backgroundColor: theme.palette.background.paper,
    },
});

const Users = ({ classes }) => (
  <UsersQuery query={FIND_USERS} variables={{ query: '*' }}>
    {({ loading, error, data }) => {
        if (loading) return 'Loading...';
        if (error) return `Error! ${error.message}`;

        return (
            <List className={classes.root}>
                {data.users.map(user => <UserListItem user={user} />)}
            </List>
        );
    }}
  </UsersQuery>
);

Users.propTypes = {
    query: PropTypes.string.isRequired,
    classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(Users);

// Query
const FIND_USERS = gql`
    query Users($query: String) {
        users(query: $query) {
            id,
            firstname,
            lastname,
            username,
            email,
            updated,
            created,
        }
    }
`;

interface Data {
    users: User[];
}

interface Variables {
    query: string;
}

class UsersQuery extends Query<Data, Variables> {}
