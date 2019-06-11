import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Segment, Message, Icon, Button } from 'semantic-ui-react';
import { validateFieldName } from '../../utils';
import SelectField from './SelectField';

const AddField: React.FC<Props> = ({ addField, available }) => {
    const [field, setField] = useState('');

    const invalid = Boolean(field && !validateFieldName(field));

    return (
        <React.Fragment>
            <Segment className="daActionSegment">
                <SelectField
                    field={field}
                    invalid={invalid}
                    available={available}
                    onChange={updatedField => {
                        setField(updatedField);
                    }}
                />
                <Button
                    className="daBorderlessButton"
                    color="blue"
                    onClick={(e: any) => {
                        e.preventDefault();
                        if (invalid) return;

                        addField(field);
                        setField('');
                    }}
                >
                    <Icon name="add" />
                    Add Field
                </Button>
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
