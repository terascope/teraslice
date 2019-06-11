import React from 'react';
import PropTypes from 'prop-types';
import { concat } from '@terascope/utils';
import { Segment, Header, Message, Icon } from 'semantic-ui-react';
import ExistingField from './ExistingField';
import AddField from './AddField';

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
            <Segment.Group>
                {fields.sort().map((field, i) => {
                    const key = `dt-${label}-${field}-${i}`;
                    return (
                        <ExistingField
                            key={key}
                            removeField={removed => {
                                update(
                                    fields.filter((f: string) => f !== removed)
                                );
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
        </Segment.Group>
    );
};

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
