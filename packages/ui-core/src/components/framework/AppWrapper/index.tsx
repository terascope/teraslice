import React from 'react';
import PropTypes from 'prop-types';
import {
    Container,
    Sidebar,
    Menu,
    Icon,
    Button,
} from 'semantic-ui-react';
import { Footer, HeaderTitle, Content } from './misc';
import SidebarMenu from './sidebar-menu';

type Props = {
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

    handleSidebarToggle = () => {
        this.setState((state) => ({ sidebarOpen: !state.sidebarOpen }));
    }

    handleSidebarHide = () => {
        this.setState({ sidebarOpen: false });
    }

    goToAccount = () => {

    }

    handleLogout = () => {

    }

    render() {
        const { authenticated, children, menus } = this.props;
        const { sidebarOpen } = this.state;

        return (
            <Content>
                <Sidebar.Pushable>
                    <SidebarMenu
                        authenticated={authenticated}
                        visible={sidebarOpen}
                        onHide={this.handleSidebarHide}
                    >{menus}</SidebarMenu>
                    <Sidebar.Pusher>
                        <Menu>
                            <Button as={Menu.Item} icon onClick={this.handleSidebarToggle}>
                                <Icon name="bars"></Icon>
                            </Button>
                            <Menu.Item as={HeaderTitle} header>
                            Teraserver
                            </Menu.Item>
                            {authenticated && (
                                <Menu.Menu position="right">
                                    <Button as={Menu.Item} icon onClick={this.goToAccount}>
                                        <Icon name="user circle" size="large"></Icon>
                                    </Button>
                                    <Button as={Menu.Item} onClick={this.handleLogout}>
                                        Logout
                                    </Button>
                                </Menu.Menu>
                            )}
                        </Menu>
                        {children}
                        <Container textAlign="center" text>
                            <Footer>Copyright &copy; 2019</Footer>
                        </Container>
                    </Sidebar.Pusher>
                </Sidebar.Pushable>
            </Content>
        );
    }
}

export default AppWrapper;
