import React from 'react';
import PropTypes from 'prop-types';
import { Redirect } from 'react-router-dom';
import { Message, Icon } from 'semantic-ui-react';

const SuccessMessage: React.FC<Props> = ({
    attached,
    title,
    message = 'Success!',
    redirectTo,
}) => {
    if (redirectTo) {
        return (
            <Redirect
                to={{
                    pathname: redirectTo,
                    state: {
                        message: { title, success: true, message },
                    },
                }}
            />
        );
    }

    let content: React.ReactNode | undefined;
    if (Array.isArray(message)) {
        content = (
            <Message.List>
                {message.map((msg, i) => (
                    <Message.Item key={`msg-${i}`}>{msg}</Message.Item>
                ))}
            </Message.List>
        );
    } else {
        content = <div className="messageText">{message}</div>;
    }

    return (
        <Message icon success attached={attached} size="large">
            <Icon name="thumbs up outline" />
            <Message.Content>
                <Message.Header>{title}</Message.Header>
                {content}
            </Message.Content>
        </Message>
    );
};

type Props = {
    title?: string;
    redirectTo?: string;
    attached?: 'bottom' | 'top';
    message?: string | string[];
};

SuccessMessage.propTypes = {
    title: PropTypes.string,
    redirectTo: PropTypes.string,
    attached: PropTypes.oneOf(['bottom', 'top']),
    message: PropTypes.any,
};

export default SuccessMessage;
