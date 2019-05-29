import React from 'react';
import PropTypes from 'prop-types';
import { Form, Segment } from 'semantic-ui-react';
import FieldName from './FieldName';

const ExistingField: React.FC<Props> = ({ removeField, field }) => {
    return (
        <Form.Group as={Segment} basic>
            <FieldName field={field} readonly onChange={() => {}} />
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
    field: string;
};

ExistingField.propTypes = {
    removeField: PropTypes.func.isRequired,
    field: PropTypes.string.isRequired,
};

export default ExistingField;
