import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import {
    Container,
    Sidebar,
    Segment,
    Header,
    Menu,
} from 'semantic-ui-react';

type Props = {
    authenticated: boolean;
};

const Footer = styled.footer`
    padding: 1rem;
`;

// const Wrapper = styled.div`
//     display: flex;
//     flex-direction: row;
//     align-items: stretch;
// `;

// const Content = styled.div`
//     display: flex;
//     flex-direction: column;
//     align-items: space-around;
// `;

const AppWrapper: React.FC<Props> = ({ authenticated, children }) => {
    return (
        <div>
            <Sidebar.Pushable>
                <Segment textAlign="center" vertical>
                    <Header>Teraserver</Header>
                </Segment>
                <Sidebar
                    as={Menu}
                    width="thin"
                    animation="push"
                    inverted
                    visible
                    vertical
                >
                    {authenticated && (
                        <Menu.Item as={Link} to="/users">
                            Users
                        </Menu.Item>
                    )}
                </Sidebar>
                <Sidebar.Pusher>
                    {children}
                    <Container textAlign="center" text>
                        <Footer>Copyright &copy; 2019</Footer>
                    </Container>
                </Sidebar.Pusher>
            </Sidebar.Pushable>
        </div>
    );
};

AppWrapper.propTypes = {
    authenticated: PropTypes.bool.isRequired,
};

export default AppWrapper;
