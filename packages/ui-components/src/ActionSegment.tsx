import React from 'react';
import PropTypes from 'prop-types';
import { Button, Segment, Icon } from 'semantic-ui-react';

const ActionSegment: React.FC<Props> = ({ onAction, children, actions }) => {
    return (
        <Segment className="actionSegment">
            {children}
            {actions.map(({ name: action, icon, color }, i) => (
                <Button
                    key={`action-${action}-${i}`}
                    className="borderlessButton"
                    color={color as any}
                    onClick={(e: any) => {
                        e.preventDefault();
                        onAction(name);
                    }}
                >
                    <Icon name={icon as any} />
                    {action}
                </Button>
            ))}
        </Segment>
    );
};

type Props = {
    onAction: (action: string) => void;
    actions: {
        icon: string;
        name: string;
        color: string;
    }[];
};

ActionSegment.propTypes = {
    onAction: PropTypes.func.isRequired,
    actions: PropTypes.arrayOf(
        PropTypes.shape({
            icon: PropTypes.string.isRequired,
            name: PropTypes.string.isRequired,
            color: PropTypes.string.isRequired,
        }).isRequired
    ).isRequired,
};

export default ActionSegment;
