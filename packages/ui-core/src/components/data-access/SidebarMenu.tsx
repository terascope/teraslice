import React from 'react';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';

const SidebarMenu: React.FC = () => {
    return (
       <List>
            <ListItem button key="/users">
                <ListItemText primary="Users" />
            </ListItem>
        </List>
    );
};

export default SidebarMenu;
