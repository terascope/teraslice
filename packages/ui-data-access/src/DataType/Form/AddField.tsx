import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { ActionSegment } from '@terascope/ui-components';
import { get, trim } from '@terascope/utils';
import FieldName from './FieldName';
import FieldType from './FieldType';
import { Form } from 'semantic-ui-react';

const AddField: React.FC<Props> = ({ add }) => {
    const [{ field, value }, setState] = useState<State>({
        field: '',
        value: '',
    });
    const type = get(value, 'type', value);

    return (
        <ActionSegment
            actions={[
                {
                    name: 'Add Field',
                    icon: 'add',
                    onClick: () => {
                        if (!value || !field) return;

                        setState(state => {
                            add(state.field, state.value);

                            return {
                                field: '',
                                value: '',
                            };
                        });
                    },
                },
            ]}
        >
            <Form.Group>
                <FieldName
                    field={field}
                    onChange={updatedField => {
                        setState({
                            field: trim(updatedField),
                            value,
                        });
                    }}
                />
                <FieldType
                    type={type}
                    onChange={updatedValue => {
                        setState({
                            value: updatedValue,
                            field,
                        });
                    }}
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
    add: (field: string, value: any) => void;
};

AddField.propTypes = {
    add: PropTypes.func.isRequired,
};

export default AddField;
