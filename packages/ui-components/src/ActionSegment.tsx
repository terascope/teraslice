import React from 'react';
import PropTypes from 'prop-types';
import { Button, Segment } from 'semantic-ui-react';

const Actions: React.FC<Props> = ({ actions }) => {
    return (
        <Button.Group className="actionButtons">
            {(actions || []).map(({ name, icon, color, onClick }, i) => (
                <Button
                    icon={icon as any}
                    key={`action-${name}-${i}`}
                    compact
                    className="actionButton"
                    color={color as any}
                    onClick={(e: React.MouseEvent) => {
                        e.preventDefault();
                        onClick();
                    }}
                />
            ))}
        </Button.Group>
    );
};

const ActionSegment: React.FC<Props> = ({ children, actions }) => {
    return (
        <Segment className="actionSegment">
            {children}
            <Actions actions={actions} />
        </Segment>
    );
};

type Props = {
    actions?: {
        icon?: string;
        name: string;
        color?: string;
        onClick: () => void;
    }[];
};

ActionSegment.propTypes = {
    actions: PropTypes.arrayOf(
        PropTypes.shape({
            icon: PropTypes.string.isRequired,
            name: PropTypes.string.isRequired,
            color: PropTypes.string,
            onClick: PropTypes.func.isRequired,
        }).isRequired
    ),
};

export default ActionSegment;
