import React from 'react';
import PropTypes from 'prop-types';
import { Button, Segment, Icon } from 'semantic-ui-react';

const Actions: React.FC<Props> = ({ actions }) => {
    if (!actions || !actions.length) {
        return <div className="borderlessButton spacerButton" />;
    }

    return (
        <React.Fragment>
            {actions.map(({ name, icon, color, onClick }) => (
                <Button
                    key={`action-${name}`}
                    className="borderlessButton"
                    color={color || 'blue'}
                    onClick={(e: React.MouseEvent) => {
                        e.preventDefault();
                        onClick();
                    }}
                >
                    {icon && <Icon name={icon as any} />}
                    {name}
                </Button>
            ))}
        </React.Fragment>
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
        color?: 'red' | 'blue';
        onClick: () => void;
    }[];
};

ActionSegment.propTypes = {
    actions: PropTypes.arrayOf(
        PropTypes.shape({
            icon: PropTypes.string.isRequired,
            name: PropTypes.string.isRequired,
            color: PropTypes.oneOf(['red', 'blue']),
            onClick: PropTypes.func.isRequired,
        }).isRequired
    ),
};

export default ActionSegment;
