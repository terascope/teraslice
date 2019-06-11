import React from 'react';
import PropTypes from 'prop-types';
import { Button, Segment, Icon } from 'semantic-ui-react';

const ActionSegment: React.FC<Props> = ({ children, actions }) => {
    return (
        <Segment className="actionSegment">
            {children}
            {actions.map(({ name, icon, color, onClick }, i) => (
                <Button
                    key={`action-${name}-${i}`}
                    className="borderlessButton"
                    color={color || 'blue'}
                    onClick={(e: React.MouseEvent) => {
                        e.preventDefault();
                        onClick();
                    }}
                >
                    <Icon name={icon as any} />
                    {name}
                </Button>
            ))}
        </Segment>
    );
};

type Props = {
    actions: {
        icon: string;
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
    ).isRequired,
};

export default ActionSegment;
