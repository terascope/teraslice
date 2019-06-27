import React from 'react';
import PropTypes from 'prop-types';
import { Form } from 'semantic-ui-react';
import { ActionSegment } from '@terascope/ui-components';
import {
    Type as FieldTypeConfig,
    AvailableType,
    AvailableTypes,
} from '@terascope/data-types';
import { dataTypeOptions } from '../interfaces';
import ArrayCheckbox from './ArrayCheckbox';

const ExistingField: React.FC<Props> = ({
    updateField,
    field,
    type,
    array,
}) => {
    return (
        <ActionSegment
            actions={[
                {
                    name: '',
                    icon: 'trash alternate',
                    color: 'red',
                    onClick() {
                        updateField(field, false);
                    },
                },
            ]}
        >
            <Form.Group>
                <Form.Input value={field}>
                    <input readOnly />
                </Form.Input>
                <Form.Select
                    placeholder="Select Field Type"
                    value={type}
                    onChange={(e, { value }) => {
                        e.preventDefault();
                        updateField(field, {
                            array,
                            type: value as AvailableType,
                        });
                    }}
                    options={dataTypeOptions}
                />
                <ArrayCheckbox
                    array={array}
                    onChange={checked => {
                        updateField(field, {
                            type,
                            array: checked,
                        });
                    }}
                />
            </Form.Group>
        </ActionSegment>
    );
};

type Props = {
    updateField: (field: string, type: FieldTypeConfig | false) => void;
    array?: boolean;
    field: string;
    type: AvailableType;
};

ExistingField.propTypes = {
    array: PropTypes.bool,
    updateField: PropTypes.func.isRequired,
    field: PropTypes.string.isRequired,
    type: PropTypes.oneOf(AvailableTypes).isRequired,
};

export default ExistingField;
