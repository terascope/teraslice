import React from 'react';
import PropTypes from 'prop-types';
import { Segment, Header, Message, Icon } from 'semantic-ui-react';
import AddField from './AddField';
import ExistingField from './ExistingField';
import { concat } from '@terascope/utils';

const Fields: React.FC<Props> = ({
    fields,
    update,
    label,
    description,
    available,
}) => {
    return (
        <Segment.Group className="daFormGroup">
            <Header as="h5" block attached="top">
                {label}
            </Header>
            <Message attached="top" className="daFormGroupDescription">
                <Icon name="info" />
                {description}
            </Message>
            {getFields(fields).map((field, i) => {
                const key = `dt-${label}-${field}-${i}`;
                return (
                    <ExistingField
                        key={key}
                        available={available}
                        removeField={removed => {
                            update(fields.filter((f: string) => f !== removed));
                        }}
                        field={field}
                    />
                );
            })}
            <AddField
                addField={added => {
                    update(concat(fields, [added]));
                }}
                available={available}
            />
        </Segment.Group>
    );
};

function getFields(fields: string[] = []) {
    return fields.sort();
}

type Props = {
    label: string;
    description: any;
    fields: string[];
    available: string[];
    update: (fields: string[]) => void;
};

Fields.propTypes = {
    label: PropTypes.string.isRequired,
    description: PropTypes.any.isRequired,
    fields: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
    available: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
    update: PropTypes.func.isRequired,
};

export default Fields;
