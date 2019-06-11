import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Message, Icon } from 'semantic-ui-react';
import { ActionSegment } from '@terascope/ui-components';
import { validateFieldName } from '../../utils';
import SelectField from './SelectField';

const AddField: React.FC<Props> = ({ addField, available }) => {
    const [field, setField] = useState('');

    const invalid = Boolean(field && !validateFieldName(field));

    return (
        <React.Fragment>
            <ActionSegment
                onAction={() => {
                    if (invalid) return;

                    addField(field);
                    setField('');
                }}
                actions={[
                    {
                        name: 'Add Field',
                        icon: 'add',
                        color: 'blue',
                    },
                ]}
            >
                <SelectField
                    field={field}
                    invalid={invalid}
                    available={available}
                    onChange={updatedField => {
                        setField(updatedField);
                    }}
                />
            </ActionSegment>
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
