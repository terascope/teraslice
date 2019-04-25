import React from 'react';
import PropTypes from 'prop-types';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import HomeIcon from '@material-ui/icons/Home';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import { CoreProps, corePropTypes } from '../../../helpers';
import Divider from '@material-ui/core/Divider';
import Drawer from '@material-ui/core/Drawer';
import IconButton from '@material-ui/core/IconButton';
import withStyles from './styles';

type Props = CoreProps & {
    authenticated?: boolean;
    sideBarOpen?: boolean;
    handleSidebarClose?: () => void;
};

class Sidebar extends React.Component<Props> {
    static propTypes = {
        ...corePropTypes,
        authenticated: PropTypes.bool.isRequired,
        sideBarOpen: PropTypes.bool,
        handleSidebarClose: PropTypes.func.isRequired,
    };

    render() {
        const {
            authenticated,
            children,
            classes,
            sideBarOpen,
            handleSidebarClose,
        } = this.props;

        if (!authenticated) return <div></div>;

        return (
            <Drawer
                className={classes.drawer}
                variant="persistent"
                anchor="left"
                open={sideBarOpen}
                classes={{
                    paper: classes.drawerPaper,
                }}
            >
                <div className={classes.drawerHeader}>
                    <IconButton onClick={handleSidebarClose}>
                    {sideBarOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
                    </IconButton>
                </div>
                <Divider />
                <List>
                    <ListItem button key="/">
                        <ListItemIcon><HomeIcon /></ListItemIcon>
                        <ListItemText primary="Home" />
                    </ListItem>
                </List>
                <Divider />
                {children}
            </Drawer>
        );
    }
}

export default withStyles(Sidebar);
