import React from 'react';
import PropTypes from 'prop-types';
import { Form, Segment } from 'semantic-ui-react';
import FieldName from './FieldName';
import FieldType from './FieldType';

const ExistingField: React.FC<Props> = ({ updateTypeConfig, field, type }) => {
    return (
        <Form.Group as={Segment} basic>
            <FieldName field={field} readonly onChange={() => {}} />
            <FieldType
                type={type}
                onChange={updated => {
                    updateTypeConfig(field, updated);
                }}
            />
            <Form.Button
                className="daFieldButton"
                icon="trash alternate outline"
                label="Delete"
                color="red"
                onClick={(e: any) => {
                    e.preventDefault();
                    updateTypeConfig(field, false);
                }}
            />
        </Form.Group>
    );
};

type Props = {
    updateTypeConfig: (field: string, type: any) => void;
    field: string;
    type: string;
};

ExistingField.propTypes = {
    updateTypeConfig: PropTypes.func.isRequired,
    field: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
};

export default ExistingField;
