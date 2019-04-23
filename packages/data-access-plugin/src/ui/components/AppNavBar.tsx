import React from 'react';
import PropTypes from 'prop-types';
import MenuIcon from '@material-ui/icons/Menu';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import { withStyles, createStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import AccountCircle from '@material-ui/icons/AccountCircle';
import MenuItem from '@material-ui/core/MenuItem';
import Menu from '@material-ui/core/Menu';

const styles = createStyles({
    root: {
        flexGrow: 1,
    },
    grow: {
        flexGrow: 1,
    },
    menuButton: {
        marginLeft: -12,
        marginRight: 20,
    },
    header: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    rightMenu: {
        display: 'flex',
        alignItems: 'center'
    }
});

type AppNavBarProps = {
    classes?: any;
    authenticated: boolean;
    onLogout: () => void;
};

type AppNavBarState = {
    open: boolean;
    anchorEl: any;
};

class AppNavBar extends React.Component<AppNavBarProps, AppNavBarState> {
    static propTypes = {
        classes: PropTypes.object.isRequired,
        authenticated: PropTypes.bool.isRequired,
        onLogout: PropTypes.func.isRequired,
    };

    state = {
        anchorEl: null,
        open: false,
    };

    handleToggle = (event: any) => {
        this.setState(state => ({
            open: !state.open,
            anchorEl: event.currentTarget
        }));
    }

    handleClose = (event: any, action?: string) => {
        if (this.state.anchorEl && this.state.anchorEl.contains(event.target)) {
            return;
        }

        this.setState({ open: false });
    }

    render() {
        const { classes, authenticated } = this.props;
        const { open, anchorEl } = this.state;

        return (
            <div className={classes.root}>
                <AppBar position="static" className={classes.header}>
                    <Toolbar>
                        <IconButton className={classes.menuButton} color="inherit" aria-label="Menu">
                            <MenuIcon />
                        </IconButton>
                        <Typography variant="h6" color="inherit" className={classes.grow}>
                            Teraserver
                        </Typography>
                    </Toolbar>
                    {authenticated && (
                        <div className={classes.rightMenu}>
                            <IconButton
                                aria-owns={open ? 'menu-appbar' : undefined}
                                aria-haspopup="true"
                                onClick={this.handleToggle}
                                color="inherit"
                            >
                                <AccountCircle />
                            </IconButton>
                            <Menu
                                id="menu-appbar"
                                anchorEl={anchorEl}
                                anchorOrigin={{
                                    vertical: 'top',
                                    horizontal: 'right',
                                }}
                                transformOrigin={{
                                    vertical: 'top',
                                    horizontal: 'right',
                                }}
                                open={open}
                                onClose={this.handleClose}
                            >
                                <MenuItem
                                    onClick={(event) => this.handleClose(event, 'MyAccount')}
                                >My Account</MenuItem>
                                <MenuItem
                                    onClick={(event) => this.handleClose(event, 'Logout')}
                                >Logout</MenuItem>
                            </Menu>
                        </div>
                    )}
                </AppBar>
            </div>
        );
    }
}

export default withStyles(styles)(AppNavBar);
