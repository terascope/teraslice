import React from 'react';
import PropTypes from 'prop-types';
import { Header, Message, Icon } from 'semantic-ui-react';

const Section: React.FC<Props> = ({ title, description, children }) => {
    return (
        <section className="coreSection">
            <Header as="h5" block attached={!description ? undefined : 'top'}>
                {title}
            </Header>
            {description && (
                <Message attached="bottom" className="sectionDescription">
                    <Icon name="info" />
                    {description}
                </Message>
            )}
            {children}
        </section>
    );
};

type Props = {
    title: string;
    description?: any;
};

Section.propTypes = {
    title: PropTypes.string.isRequired,
    description: PropTypes.any,
};

export default Section;
