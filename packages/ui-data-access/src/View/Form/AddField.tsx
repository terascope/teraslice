import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Form, Segment, Message, Icon } from 'semantic-ui-react';
import { validateFieldName } from '../../utils';
import FieldName from './FieldName';

const AddField: React.FC<Props> = ({ addField, available }) => {
    const [field, setField] = useState('');

    const invalid = Boolean(field && !validateFieldName(field));

    return (
        <React.Fragment>
            <Message attached header="" />
            <Segment className="daAddFieldGroup" basic attached>
                <Form.Group>
                    <FieldName
                        field={field}
                        invalid={invalid}
                        available={available}
                        onChange={updatedField => {
                            setField(updatedField);
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
                            if (invalid) return;

                            addField(field);
                            setField('');
                        }}
                    />
                </Form.Group>
            </Segment>
            {invalid ? (
                <Message attached="bottom" error className="daFormMessage">
                    <Icon name="times" />
                    Field name can only contain alpha-numeric characters,
                    underscores and dashes. A field restriction on{' '}
                    <pre className="daFormMessageCode">example</pre> will
                    restrict{' '}
                    <pre className="daFormMessageCode">example.field</pre>
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

type Props = {
    addField: (field: string) => void;
    available: string[];
};

AddField.propTypes = {
    addField: PropTypes.func.isRequired,
    available: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
};

export default AddField;
