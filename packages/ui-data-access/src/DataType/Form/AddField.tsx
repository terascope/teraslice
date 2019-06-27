import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Form, Label } from 'semantic-ui-react';
import { trim } from '@terascope/utils';
import { AvailableType } from '@terascope/data-types';
import { ActionSegment } from '@terascope/ui-components';
import { dataTypeOptions } from '../interfaces';
import { validateFieldName } from '../../utils';

const AddField: React.FC<Props> = ({ addField, fields }) => {
    const [state, setState] = useState<State>({
        field: '',
        fieldError: '',
        type: '',
        typeError: '',
    });

    const updateState = (updates: Partial<State>): void => {
        const latestState = { ...state, ...updates };
        validate(latestState);
        setState(latestState);
    };

    const validate = (latestState: State): State => {
        latestState.fieldError = '';
        latestState.typeError = '';
        if (!latestState.field) {
            latestState.fieldError = 'Field is required';
            return latestState;
        }
        if (fields.includes(latestState.field)) {
            latestState.fieldError = 'Duplicate fields cannot be specified';
            return latestState;
        }
        if (!validateFieldName(latestState.field)) {
            latestState.fieldError = 'Invalid field name';
            return latestState;
        }
        if (!latestState.type) {
            latestState.typeError = 'Type is required';
            return latestState;
        }
        return latestState;
    };

    return (
        <ActionSegment
            actions={[
                {
                    name: 'Add',
                    icon: 'add',
                    onClick: () => {
                        if (state.fieldError || state.typeError) return;

                        addField(state.field, {
                            type: state.type,
                        });
                        setState({
                            field: '',
                            fieldError: '',
                            type: '',
                            typeError: '',
                        });
                    },
                },
            ]}
        >
            <Form.Group>
                <Form.Field>
                    <Form.Input
                        type="text"
                        placeholder="Field Name"
                        value={state.field}
                        error={Boolean(state.fieldError)}
                        onChange={(e, { value: updatedField }) => {
                            e.preventDefault();

                            updateState({ field: trim(updatedField) });
                        }}
                    />
                    {state.fieldError && (
                        <Label pointing color="red" basic>
                            {state.fieldError}
                        </Label>
                    )}
                </Form.Field>
                <Form.Field>
                    <Form.Select
                        placeholder="Select Field Type"
                        value={state.type}
                        error={Boolean(state.typeError)}
                        onChange={(e, { value }) => {
                            e.preventDefault();

                            const updatedType = value as AvailableType;
                            updateState({ type: updatedType });
                        }}
                        options={dataTypeOptions}
                    />
                    {state.typeError && (
                        <Label pointing color="red" basic>
                            {state.typeError}
                        </Label>
                    )}
                </Form.Field>
            </Form.Group>
        </ActionSegment>
    );
};

type State = {
    field: string;
    fieldError: string;
    type: AvailableType | '';
    typeError: string;
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
