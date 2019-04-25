import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import withStyles from './styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import Navbar from './navbar';
import Sidebar from './sidebar-menu';
import { CoreProps } from '../../../helpers';

type Props = CoreProps & {
    authenticated: boolean;
    menus: React.ReactNode;
};

type State = {
    sidebarOpen: boolean;
};

class AppWrapper extends React.Component<Props, State> {
    static propTypes =  {
        authenticated: PropTypes.bool.isRequired,
        menus: PropTypes.any.isRequired,
    };

    state = {
        sidebarOpen: false,
    };

    handleSidebarOpen = () => {
        this.setState({ sidebarOpen: true });
    }

    handleSidebarClose = () => {
        this.setState({ sidebarOpen: false });
    }

    goToAccount = () => {

    }

    handleLogout = () => {

    }

    render() {
        const { classes, authenticated, children, menus } = this.props;
        const { sidebarOpen } = this.state;

        return (
            <div className={classes.root}>
                <CssBaseline />
                <Navbar
                    authenticated
                    handleSidebarOpen={this.handleSidebarOpen}
                 />
                <Sidebar
                    authenticated={authenticated}
                    sideBarOpen={sidebarOpen}
                    handleSidebarClose={this.handleSidebarClose}
                >{menus}</Sidebar>
                <main
                    className={classNames(classes.content, {
                        [classes.contentShift]: sidebarOpen,
                    })}
                    >
                    <div className={classes.drawerHeader} />
                    <div>
                        {children}
                    </div>
                    <footer className={classes.footer}>Copyright &copy; 2019</footer>
                </main>
            </div>
        );
    }
}

export default withStyles(AppWrapper);
