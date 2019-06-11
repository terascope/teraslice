import React from 'react';
import PropTypes from 'prop-types';
import { Button, Segment, Icon } from 'semantic-ui-react';

const ExistingField: React.FC<Props> = ({ removeField, field }) => {
    return (
        <Segment className="daActionSegment">
            <div>
                {field.split('.').map((str, i) => (
                    <span key={`${str}-${i}`} style={getPartStyle(i)}>
                        {i > 0 ? `.${str}` : str}
                    </span>
                ))}
            </div>
            <Button
                className="daBorderlessButton"
                color="red"
                onClick={(e: any) => {
                    e.preventDefault();
                    removeField(field);
                }}
            >
                <Icon name="trash alternate outline" />
                Remove
            </Button>
        </Segment>
    );
};

function getPartStyle(i: number): React.CSSProperties {
    if (i === 0) return { fontWeight: 600 };
    if (i === 1) return { fontWeight: 700 };
    if (i === 2) return { fontWeight: 800 };
    return { fontWeight: 900 };
}

type Props = {
    removeField: (field: string) => void;
    field: string;
};

ExistingField.propTypes = {
    removeField: PropTypes.func.isRequired,
    field: PropTypes.string.isRequired,
};

export default ExistingField;
