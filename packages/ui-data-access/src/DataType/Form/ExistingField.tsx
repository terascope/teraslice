import React from 'react';
import PropTypes from 'prop-types';
import { Form } from 'semantic-ui-react';
import { ActionSegment } from '@terascope/ui-components';
import { dataTypeOptions } from '../interfaces';

const ExistingField: React.FC<Props> = ({ updateField, field, type }) => {
    return (
        <ActionSegment
            actions={[
                {
                    name: 'Remove',
                    icon: 'times',
                    color: 'red',
                    onClick() {
                        updateField(field, false);
                    },
                },
            ]}
        >
            <Form.Group style={{ paddingTop: '0.8rem' }}>
                <Form.Input value={field}>
                    <input readOnly />
                </Form.Input>
                <Form.Select
                    placeholder="Select Field Type"
                    value={type}
                    onChange={(e, { value }) => {
                        e.preventDefault();
                        updateField(field, value);
                    }}
                    options={dataTypeOptions}
                />
            </Form.Group>
        </ActionSegment>
    );
};

type Props = {
    updateField: (field: string, type: any) => void;
    field: string;
    type: string;
};

ExistingField.propTypes = {
    updateField: PropTypes.func.isRequired,
    field: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
};

export default ExistingField;
