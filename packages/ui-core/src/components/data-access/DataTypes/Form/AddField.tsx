import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { get } from '@terascope/utils';
import { Form } from 'semantic-ui-react';
import FieldName from './FieldName';
import FieldType from './FieldType';

const AddField: React.FC<Props> = ({ add }) => {
    const [{ field, value, touched }, setState] = useState<State>({
        field: '',
        value: '',
        touched: false,
    });
    const type = get(value, 'type', value);

    return (
        <Form.Group>
            <FieldName
                field={field}
                width={4}
                invalid={Boolean(touched && type && !field)}
                onChange={updatedField => {
                    setState({ field: updatedField, value, touched: true });
                }}
            />
            <FieldType
                type={type}
                width={3}
                invalid={Boolean(touched && field && !type)}
                onChange={updatedValue => {
                    setState({ value: updatedValue, field, touched: true });
                }}
            />
            <Form.Button
                className="daAddFieldButton"
                icon="add"
                label="Add"
                primary
                onClick={(e: any) => {
                    e.preventDefault();
                    if (!value || !field) return;

                    setState(state => {
                        add(state.field, state.value);

                        return {
                            field: '',
                            value: '',
                            touched: false,
                        };
                    });
                }}
            />
        </Form.Group>
    );
};

type State = {
    field: string;
    value: any;
    touched: boolean;
};

type Props = {
    add: (field: string, value: any) => void;
};

AddField.propTypes = {
    add: PropTypes.func.isRequired,
};

export default AddField;
