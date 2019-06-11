import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { get, trim } from '@terascope/utils';
import { Form, Segment, Message, Icon } from 'semantic-ui-react';
import { validateFieldName } from '../../utils';
import FieldName from './FieldName';
import FieldType from './FieldType';

const AddField: React.FC<Props> = ({ add }) => {
    const [{ field, value }, setState] = useState<State>({
        field: '',
        value: '',
    });
    const type = get(value, 'type', value);

    const isFieldInvalid = Boolean(field && !validateFieldName(field));
    const invalid = isFieldInvalid && !type;

    return (
        <React.Fragment>
            <Segment className="daAddFieldGroup" basic attached>
                <Form.Group>
                    <FieldName
                        field={field}
                        invalid={isFieldInvalid}
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
                    <Form.Button
                        className="daFieldButton"
                        icon="add"
                        label="Add"
                        primary
                        disabled={invalid}
                        onClick={(e: any) => {
                            e.preventDefault();
                            if (!value || !field) return;

                            setState(state => {
                                add(state.field, state.value);

                                return {
                                    field: '',
                                    value: '',
                                };
                            });
                        }}
                    />
                </Form.Group>
            </Segment>
            {invalid ? (
                <Message attached="bottom" error className="daFormMessage">
                    <Icon name="times" />
                    Field name can only contain alpha-numeric characters,
                    underscores and dashes.
                </Message>
            ) : (
                <Message attached="bottom" info>
                    <Icon name="info" />
                    Use dot notation to specify nested properties, e.g. &nbsp;
                    <pre className="daFormMessageCode">example.field</pre>
                </Message>
            )}
        </React.Fragment>
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
