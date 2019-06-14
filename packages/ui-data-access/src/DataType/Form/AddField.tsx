import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Form } from 'semantic-ui-react';
import { get, trim } from '@terascope/utils';
import { AvailableType } from '@terascope/data-types';
import { ActionSegment } from '@terascope/ui-components';
import { dataTypeOptions } from '../interfaces';

const AddField: React.FC<Props> = ({ addField, fields }) => {
    const [{ field, value }, setState] = useState<State>({
        field: '',
        value: '',
    });
    const type: AvailableType = get(value, 'type', value);

    return (
        <ActionSegment
            actions={[
                {
                    name: 'Add',
                    icon: 'add',
                    onClick: () => {
                        if (!value || !field) return;
                        if (fields.includes(field)) return;

                        setState(state => {
                            addField(state.field, state.value);

                            return {
                                field: '',
                                value: '',
                            };
                        });
                    },
                },
            ]}
        >
            <Form.Group style={{ paddingTop: '0.8rem' }}>
                <Form.Input
                    placeholder="Field Name"
                    value={field}
                    error={fields.includes(field)}
                    onChange={(e, { value: updatedField }) => {
                        e.preventDefault();
                        setState({
                            field: trim(updatedField),
                            value,
                        });
                    }}
                />
                <Form.Select
                    placeholder="Select Field Type"
                    value={type}
                    onChange={(e, { value: updatedValue }) => {
                        e.preventDefault();
                        setState({
                            value: updatedValue,
                            field,
                        });
                    }}
                    options={dataTypeOptions}
                />
            </Form.Group>
        </ActionSegment>
    );
};

type State = {
    field: string;
    value: any;
};

type Props = {
    addField: (field: string, value: any) => void;
    fields: string[];
};

AddField.propTypes = {
    addField: PropTypes.func.isRequired,
    fields: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
};

export default AddField;
