import React from 'react';
import PropTypes from 'prop-types';
import { Segment, Header, Message, Icon } from 'semantic-ui-react';
import AddField from './AddField';
import ExistingField from './ExistingField';

const Fields: React.FC<Props> = ({
    fields,
    addField,
    removeField,
    label,
    description,
}) => {
    return (
        <Segment.Group className="daFieldValueGroup">
            <Header as="h5" block attached="top">
                {label}
            </Header>
            <Message attached="top">
                <Icon name="info" />
                {description}
            </Message>
            {fields.map((field, i) => {
                const key = `dt-${label}-${field}-${i}`;
                return (
                    <ExistingField
                        key={key}
                        removeField={removeField}
                        field={field}
                    />
                );
            })}
            <AddField addField={addField} />
        </Segment.Group>
    );
};

type Props = {
    label: string;
    description: any;
    fields: string[];
    addField: (field: string) => void;
    removeField: (field: string) => void;
};

Fields.propTypes = {
    label: PropTypes.string.isRequired,
    description: PropTypes.any.isRequired,
    addField: PropTypes.func.isRequired,
    removeField: PropTypes.func.isRequired,
    fields: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
};

export default Fields;
