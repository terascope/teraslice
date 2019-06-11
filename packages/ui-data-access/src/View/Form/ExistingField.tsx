import React from 'react';
import PropTypes from 'prop-types';
import { ActionSegment } from '@terascope/ui-components';
import FieldParts from './FieldParts';

const ExistingField: React.FC<Props> = ({ removeField, field }) => {
    return (
        <ActionSegment
            onAction={() => {
                removeField(field);
            }}
            actions={[
                {
                    name: 'Remove',
                    icon: 'trash alternate outline',
                    color: 'red',
                },
            ]}
        >
            <FieldParts className="daActionLabel" field={field} />
        </ActionSegment>
    );
};

type Props = {
    removeField: (field: string) => void;
    field: string;
};

ExistingField.propTypes = {
    removeField: PropTypes.func.isRequired,
    field: PropTypes.string.isRequired,
};

export default ExistingField;
