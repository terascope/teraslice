import React from 'react';
import PropTypes from 'prop-types';
import { ActionSegment } from '@terascope/ui-components';
import FieldName from './FieldName';
import FieldType from './FieldType';
import { Form } from 'semantic-ui-react';

const ExistingField: React.FC<Props> = ({ updateTypeConfig, field, type }) => {
    return (
        <ActionSegment
            actions={[
                {
                    name: 'Remove',
                    icon: 'trash alternate outline',
                    color: 'red',
                    onClick() {
                        updateTypeConfig(field, false);
                    },
                },
            ]}
        >
            <Form.Group>
                <FieldName field={field} readonly onChange={() => {}} />
                <FieldType
                    type={type}
                    onChange={updated => {
                        updateTypeConfig(field, updated);
                    }}
                />
            </Form.Group>
        </ActionSegment>
    );
};

type Props = {
    updateTypeConfig: (field: string, type: any) => void;
    field: string;
    type: string;
};

ExistingField.propTypes = {
    updateTypeConfig: PropTypes.func.isRequired,
    field: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
};

export default ExistingField;
