import React from 'react';
import PropTypes from 'prop-types';
import { parseErrorInfo } from '@terascope/utils';
import { Header, Container, Segment } from 'semantic-ui-react';

type ErrorInfoProps = {
    error: any;
};

const ErrorInfo: React.FC<ErrorInfoProps> = ({ error }) => {
    const { message } = parseErrorInfo(error);
    return (
        <Segment>
            <Header>Error</Header>
            <Container text>{message}</Container>
        </Segment>
    );
};

ErrorInfo.propTypes = {
    error: PropTypes.any.isRequired,
};

export default ErrorInfo;
