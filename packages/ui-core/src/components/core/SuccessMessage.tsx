import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Redirect } from 'react-router';
import { Message, Icon } from 'semantic-ui-react';

const SuccessMessage: React.FC<Props> = ({
    attached,
    title,
    message,
    redirectDelay,
    redirectTo,
}) => {
    const [redirectNow, setRedirect] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (redirectNow) return;
            setRedirect(true);
        }, redirectDelay);

        return () => {
            clearTimeout(timer);
        };
    }, [redirectDelay, redirectNow]);

    let content: React.ReactNode | undefined;
    if (Array.isArray(message)) {
        content = (
            <Message.List>
                {message.map((msg, i) => (
                    <Message.Item key={`error-msg-${i}`}>{msg}</Message.Item>
                ))}
            </Message.List>
        );
    } else {
        content = message;
    }

    return (
        <Message icon success attached={attached} size="large">
            <Icon name="thumbs up outline" />
            <Message.Content>
                <Message.Header>{title || 'Success!'}</Message.Header>
                {redirectNow && redirectTo ? <Redirect to={redirectTo} /> : content}
            </Message.Content>
        </Message>
    );
};

type Props = {
    title?: string;
    redirectTo?: string;
    redirectDelay?: number;
    attached?: 'bottom' | 'top';
    loading?: boolean;
    message?: React.ReactElement | string[];
};

SuccessMessage.propTypes = {
    title: PropTypes.string,
    redirectTo: PropTypes.string,
    redirectDelay: PropTypes.number,
    attached: PropTypes.oneOf(['bottom', 'top']),
    loading: PropTypes.any,
    message: PropTypes.any,
};

export default SuccessMessage;
