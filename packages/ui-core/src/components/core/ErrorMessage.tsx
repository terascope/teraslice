import React from 'react';
import PropTypes from 'prop-types';
import { Message, Icon } from 'semantic-ui-react';
import { parseErrorInfo, TSError } from '@terascope/utils';
import { ApolloError } from 'apollo-boost';
import { Redirect } from 'react-router-dom';

const ErrorMessage: React.FC<Props> = ({
    error,
    attached,
    title = 'Error',
    redirectTo,
}) => {
    if (redirectTo) {
        return (
            <Redirect
                to={{
                    pathname: redirectTo,
                    state: {
                        message: {
                            title,
                            success: false,
                            message: parseError(error),
                        },
                    },
                }}
            />
        );
    }

    let content: React.ReactNode | undefined;
    if (Array.isArray(error)) {
        content = (
            <Message.List>
                {error.map((err, i) => (
                    <Message.Item key={`error-msg-${i}`}>
                        {parseError(err)}
                    </Message.Item>
                ))}
            </Message.List>
        );
    } else {
        content = parseError(error);
    }

    return (
        <Message icon error attached={attached}>
            <Icon name="times circle outline" />
            <Message.Content>
                <Message.Header>{title}</Message.Header>
                {content}
            </Message.Content>
        </Message>
    );
};

function parseError(error?: AnyErrorType | AnyErrorType[]) {
    if (Array.isArray(error)) {
        return error.map(err => parseErrorInfo(err).message);
    }
    return parseErrorInfo(error).message;
}

type AnyErrorType = string | object | ApolloError | Error | TSError;
type Props = {
    error?: AnyErrorType | AnyErrorType[];
    redirectTo?: string;
    title?: string;
    attached?: 'bottom' | 'top';
};

ErrorMessage.propTypes = {
    error: PropTypes.any,
    redirectTo: PropTypes.string,
    title: PropTypes.string,
    attached: PropTypes.oneOf(['bottom', 'top']),
};

export default ErrorMessage;
