import React from 'react';
import PropTypes from 'prop-types';
import { AnyObject } from '@terascope/utils';
import { User } from '@terascope/data-access';
import { withStyles, ListItemAvatar } from '@material-ui/core';
import Person from '@material-ui/icons/Person';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Typography from '@material-ui/core/Typography';

type UserListItemProps = {
    classes: AnyObject;
    user: User;
};

const styles = {
    inline: {
        display: 'inline',
    },
};

const UserListItem = ({ user, classes }: UserListItemProps) => {
    const name = `${user.firstname} ${user.lastname}`;
    return (
        <ListItem alignItems="flex-start">
            <ListItemAvatar>
                <Person />
            </ListItemAvatar>
            <ListItemText
                primary={name}
                secondary={
                    <Typography component="span" className={classes.root} color="textSecondary">
                        {user.username}
                    </Typography>
                }
            />
        </ListItem>
    );
};

UserListItem.propTypes = {
    classes: PropTypes.object.isRequired,
    users: PropTypes.object.isRequired,
};

export default withStyles(styles)(UserListItem);
