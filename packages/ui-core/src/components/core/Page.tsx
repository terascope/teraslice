import React from 'react';
import PropTypes from 'prop-types';
import { Container, Segment, Header } from 'semantic-ui-react';

type Props = {
    title: string;
};

const Page: React.FC<Props> = ({ children, title }) => {
    return (
        <Container>
            <Segment>
                <Header as="h2">{title}</Header>
                {children}
            </Segment>
        </Container>
    );
};

Page.propTypes = {
    title: PropTypes.string.isRequired,
};

export default Page;
