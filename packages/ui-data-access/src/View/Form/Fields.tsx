import React from 'react';
import PropTypes from 'prop-types';
import { concat } from '@terascope/utils';
import { Segment } from 'semantic-ui-react';
import ExistingField from './ExistingField';
import AddField from './AddField';

const Fields: React.FC<Props> = ({ fields = [], update, available }) => {
    return (
        <Segment.Group>
            {fields.sort().map((field, i) => {
                return (
                    <ExistingField
                        key={`${field}-${i}`}
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

type Props = {
    fields?: string[];
    available: string[];
    update: (fields: string[]) => void;
};

Fields.propTypes = {
    fields: PropTypes.arrayOf(PropTypes.string.isRequired),
    available: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
    update: PropTypes.func.isRequired,
};

export default Fields;
