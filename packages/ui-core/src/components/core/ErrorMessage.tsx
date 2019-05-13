import React from 'react';
import PropTypes from 'prop-types';
import { Message, Icon } from 'semantic-ui-react';
import { parseErrorInfo, TSError } from '@terascope/utils';
import { ApolloError } from 'apollo-boost';

const ErrorMessage: React.FC<Props> = ({ error, attached, title }) => {
    let content: React.ReactNode | undefined;
    if (Array.isArray(error)) {
        content = (
            <Message.List>
                {error.map((err, i) => (
                    <Message.Item key={`error-msg-${i}`}>{parseError(err)}</Message.Item>
                ))}
            </Message.List>
        );
    } else {
        content = parseError(error);
    }

    return (
        <Message icon error attached={attached} size="large">
            <Icon name="times circle outline" />
            <Message.Content>
                <Message.Header>{title || 'Error'}</Message.Header>
                {content}
            </Message.Content>
        </Message>
    );
};

function parseError(error?: AnyErrorType) {
    return parseErrorInfo(error).message;
}

type AnyErrorType = string | object | ApolloError | Error | TSError;
type Props = {
    error?: AnyErrorType | AnyErrorType[];
    title?: string;
    attached?: 'bottom' | 'top';
};

const AnyErrorPropType = PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object,
    PropTypes.instanceOf(ApolloError),
    PropTypes.instanceOf(TSError),
    PropTypes.instanceOf(Error),
    PropTypes.instanceOf(TSError),
]);

ErrorMessage.propTypes = {
    error: PropTypes.oneOf([AnyErrorPropType, PropTypes.arrayOf(AnyErrorPropType)])
        .isRequired,
    title: PropTypes.string,
    attached: PropTypes.oneOf(['bottom', 'top']),
};

export default ErrorMessage;
