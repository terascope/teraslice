import React from 'react';
import PropTypes from 'prop-types';
import { Form, Segment } from 'semantic-ui-react';
import FieldName from './FieldName';

const ExistingField: React.FC<Props> = ({ removeField, field, available }) => {
    return (
        <Form.Group as={Segment} basic>
            <FieldName
                available={available}
                field={field}
                readonly
                onChange={() => {}}
            />
            <Form.Button
                className="daFieldButton"
                icon="trash alternate outline"
                label="Delete"
                color="red"
                onClick={(e: any) => {
                    e.preventDefault();
                    removeField(field);
                }}
            />
        </Form.Group>
    );
};

type Props = {
    removeField: (field: string) => void;
    available: string[];
    field: string;
};

ExistingField.propTypes = {
    removeField: PropTypes.func.isRequired,
    available: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
    field: PropTypes.string.isRequired,
};

export default ExistingField;
