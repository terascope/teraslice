import React from 'react';
import PropTypes from 'prop-types';
import { Segment, Header } from 'semantic-ui-react';
import { parseErrorInfo } from '@terascope/utils';

type ErrorInfoProps = {
    error: any;
};

const ErrorInfo: React.FC<ErrorInfoProps> = ({ error }) => {
    const { message } = parseErrorInfo(error);
    return (
        <Segment>
            <Header as="h2">Error</Header>
            <p>{message}</p>
        </Segment>
    );
};

ErrorInfo.propTypes = {
    error: PropTypes.any.isRequired,
};

export default ErrorInfo;
