import React from 'react';
import PropTypes from 'prop-types';
import {
    Segment,
    Header,
} from 'semantic-ui-react';

type Props = {
    title: string;
};

const Page: React.FC<Props> = ({ children, title }) => {
    return (
        <Segment basic>
            <Header>{title}</Header>
            {children}
        </Segment>
    );
};

Page.propTypes = {
    title: PropTypes.string.isRequired,
};

export default Page;
