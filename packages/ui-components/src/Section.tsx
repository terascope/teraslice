import React from 'react';
import PropTypes from 'prop-types';
import { Header, Message, Segment, Icon } from 'semantic-ui-react';

const Section: React.FC<Props> = ({
    title,
    description,
    children,
    error,
    info,
}) => {
    return (
        <Segment.Group>
            <Header as="h5" block attached="top">
                {title}
            </Header>
            {description && (
                <Message attached="bottom" className="sectionDescription">
                    {description}
                </Message>
            )}
            {children}
            {error && (
                <Message attached="bottom" error className="sectionMessage">
                    <Icon name="times" />
                    <Message.Content>{error}</Message.Content>
                </Message>
            )}
            {info && (
                <Message attached="bottom" info className="sectionMessage">
                    <Icon name="info" />
                    <Message.Content>{info}</Message.Content>
                </Message>
            )}
        </Segment.Group>
    );
};

type Props = {
    title: string;
    description?: any;
    info?: any;
    error?: any;
};

Section.propTypes = {
    title: PropTypes.string.isRequired,
    description: PropTypes.any,
    info: PropTypes.any,
    error: PropTypes.any,
};

export default Section;
