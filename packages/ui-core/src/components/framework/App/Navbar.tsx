import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import MenuIcon from '@material-ui/icons/Menu';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import AccountCircle from '@material-ui/icons/AccountCircle';
import MenuItem from '@material-ui/core/MenuItem';
import Menu from '@material-ui/core/Menu';
import withStyles from './styles';
import { CoreProps, corePropTypes } from '../../../helpers';

type Props = CoreProps & {
    authenticated: boolean;
    sideBarOpen?: boolean;
    handleSidebarOpen: () => void;
};

type State = {
    rightMenuOpen: boolean;
};

class Navbar extends React.Component<Props, State> {
    static propTypes = {
        ...corePropTypes,
        sideBarOpen: PropTypes.bool,
        authenticated: PropTypes.bool.isRequired,
        handleSidebarOpen: PropTypes.func.isRequired,
    };

    state: State = {
        rightMenuOpen: false,
    };

    handleToggle = () => {
        this.setState(state => ({
            rightMenuOpen: !state.rightMenuOpen,
        }));
    }

    handleClose = () => {
        this.setState({ rightMenuOpen: false });
    }

    handleMyAccount = () => {
        this.handleClose();
    }

    handleLogin = () => {
        this.handleClose();
    }

    render() {
        const {
            classes,
            authenticated,
            sideBarOpen,
            handleSidebarOpen
        } = this.props;
        const { rightMenuOpen } = this.state;

        return (
            <AppBar
                position="fixed"
                className={classNames(classes.appBar, {
                    [classes.appBarShift]: sideBarOpen,
                })}
            >
                <Toolbar disableGutters={!sideBarOpen} className={classes.toolbar}>
                    <IconButton
                        color="inherit"
                        aria-label="Open drawer"
                        onClick={handleSidebarOpen}
                        className={classNames(classes.menuButton, sideBarOpen && classes.hide)}
                    >
                    <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" color="inherit" noWrap>
                        Teraserver
                    </Typography>
                    <div className={classes.grow} />
                    {authenticated && (
                        <div className={classes.rightMenu}>
                            <IconButton
                                aria-owns={rightMenuOpen ? 'menu-appbar' : undefined}
                                aria-haspopup="true"
                                onClick={this.handleToggle}
                                color="inherit"
                            >
                                <AccountCircle />
                            </IconButton>
                            <Menu
                                id="menu-appbar"
                                anchorOrigin={{
                                    vertical: 'top',
                                    horizontal: 'right',
                                }}
                                transformOrigin={{
                                    vertical: 'top',
                                    horizontal: 'right',
                                }}
                                open={rightMenuOpen}
                                onClose={this.handleClose}
                            >
                                <MenuItem onClick={this.handleMyAccount}>
                                    My Account
                                </MenuItem>
                                <MenuItem onClick={this.handleLogin}>
                                    Logout
                                </MenuItem>
                            </Menu>
                        </div>
                    )}
                </Toolbar>
            </AppBar>
        );
    }
}

export default withStyles(Navbar);
