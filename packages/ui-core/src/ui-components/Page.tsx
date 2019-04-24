import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import {
    Responsive,
    Container,
    Segment,
    Header,
} from 'semantic-ui-react';

type Props = {
    title: string;
};

const Footer = styled.footer`
    padding: 1rem;
`;

const Page: React.FC<Props> = ({ children, title }) => {
    return (
        <Responsive>
            <Container fluid>
                <Segment>
                    <Header>{title}</Header>
                    {children}
                </Segment>
            </Container>
            <Container textAlign="center" text>
                <Footer>Copyright &copy; 2019</Footer>
            </Container>
        </Responsive>
    );
};

Page.propTypes = {
    title: PropTypes.string.isRequired,
};

export default Page;
