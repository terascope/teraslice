import React from 'react';
import PropTypes from 'prop-types';
import { Button, Segment, Icon } from 'semantic-ui-react';
import FieldParts from './FieldParts';

const ExistingField: React.FC<Props> = ({ removeField, field }) => {
    return (
        <Segment className="daActionSegment">
            <FieldParts className="daActionLabel" field={field} />
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

type Props = {
    removeField: (field: string) => void;
    field: string;
};

ExistingField.propTypes = {
    removeField: PropTypes.func.isRequired,
    field: PropTypes.string.isRequired,
};

export default ExistingField;
