import React from 'react';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import PeopleIcon from '@material-ui/icons/People';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemIcon from '@material-ui/core/ListItemIcon';

const SidebarMenu: React.FC = () => {
    return (
       <List>
            <ListItem button key="/users">
                <ListItemIcon><PeopleIcon /></ListItemIcon>
                <ListItemText primary="Users" />
            </ListItem>
        </List>
    );
};

export default SidebarMenu;
