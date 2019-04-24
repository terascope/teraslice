import React from 'react';
import PropTypes from 'prop-types';
import * as ui from 'semantic-ui-react';

type Props = {
    title: string;
};

const Page: React.FC<Props> = ({ children, title }) => {
    return (
        <ui.Responsive>
            <ui.Container fluid>
                <ui.Segment>
                    <ui.Header>{title}</ui.Header>
                    {children}
                </ui.Segment>
            </ui.Container>
            <ui.Container textAlign="center" text>
                <footer>Copyright ©2019</footer>
            </ui.Container>
        </ui.Responsive>
    );
};

Page.propTypes = {
    title: PropTypes.string.isRequired,
};

export default Page;
