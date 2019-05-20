import React from 'react';
import PropTypes from 'prop-types';
import { Segment, Container } from 'semantic-ui-react';
import ErrorMessage from './ErrorMessage';

const ErrorPage: React.FC<Props> = ({ error }) => {
    return (
        <Container className="simplePageContainer">
            <Segment className="simplePageContent" padded="very">
                <ErrorMessage error={error} />
            </Segment>
        </Container>
    );
};

type Props = {
    error: any;
};

ErrorPage.propTypes = {
    error: PropTypes.any.isRequired,
};

export default ErrorPage;
