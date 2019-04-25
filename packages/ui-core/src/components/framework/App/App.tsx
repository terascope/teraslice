import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import withStyles from './styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { CoreProps } from '../../../helpers';

type Props = CoreProps & {
    authenticated: boolean;
    menus: React.FunctionComponent[];
};

type State = {
    sidebarOpen: boolean;
};

class App extends React.Component<Props, State> {
    static propTypes =  {
        authenticated: PropTypes.bool.isRequired,
        menus: PropTypes.arrayOf(PropTypes.func.isRequired).isRequired,
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
                    menus={menus}
                />
                <main
                    className={classNames(classes.content, {
                        [classes.contentShift]: sidebarOpen,
                    })}
                    >
                    <div className={classes.drawerHeader} />
                    <div>{children}</div>
                    <Footer />
                </main>
            </div>
        );
    }
}

export default withStyles(App);
