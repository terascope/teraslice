import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { trim } from '@terascope/utils';
import { Form, Label } from 'semantic-ui-react';
import { ActionSegment } from '@terascope/ui-components';
import { AvailableType, Type as FieldTypeConfig } from '@terascope/data-types';
import { dataTypeOptions } from '../interfaces';
import { validateFieldName } from '../../utils';
import ArrayCheckbox from './ArrayCheckbox';

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
                    name: '',
                    icon: 'add',
                    color: 'blue',
                    onClick: () => {
                        if (state.fieldError || state.typeError) return;

                        addField(state.field, {
                            type: state.type as AvailableType,
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
                        onChange={(e, { value }) => {
                            e.preventDefault();

                            updateState({
                                field: trim(value),
                            });
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

                            updateState({
                                type: value as AvailableType,
                            });
                        }}
                        options={dataTypeOptions}
                    />
                    {state.typeError && (
                        <Label pointing color="red" basic>
                            {state.typeError}
                        </Label>
                    )}
                </Form.Field>
                <ArrayCheckbox
                    array={state.array}
                    onChange={checked => {
                        updateState({ array: checked });
                    }}
                />
            </Form.Group>
        </ActionSegment>
    );
};

type State = {
    field: string;
    fieldError: string;
    type: AvailableType | '';
    typeError: string;
    array?: boolean;
};

type Props = {
    addField: (field: string, config: FieldTypeConfig) => void;
    fields: string[];
};

AddField.propTypes = {
    addField: PropTypes.func.isRequired,
    fields: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
};

export default AddField;
