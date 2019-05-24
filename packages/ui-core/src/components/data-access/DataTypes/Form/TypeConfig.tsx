import React from 'react';
import PropTypes from 'prop-types';
import { Form } from 'semantic-ui-react';
import { AnyObject, get } from '@terascope/utils';
import FieldName from './FieldName';
import FieldType from './FieldType';
import AddField from './AddField';

const TypeConfig: React.FC<Props> = ({ updateTypeConfig, typeConfig = {} }) => {
    return (
        <React.Fragment>
            {getEntries(typeConfig).map(([field, value], i) => {
                const type = get(value, 'type', value);
                const key = `data-type-config-${field}-${i}`;
                return (
                    <Form.Group key={key}>
                        <FieldName
                            field={field}
                            onChange={field => {
                                updateTypeConfig(field, value);
                            }}
                        />
                        <FieldType
                            type={type}
                            onChange={field => {
                                updateTypeConfig(field, value);
                            }}
                        />
                    </Form.Group>
                );
            })}
            <AddField add={updateTypeConfig} />
        </React.Fragment>
    );
};

function getEntries(typeConfig: AnyObject): ([string, any])[] {
    if (!typeConfig) return [];
    return Object.entries(typeConfig);
}

type Props = {
    updateTypeConfig: (field: string, value: any) => void;
    typeConfig: AnyObject;
};

TypeConfig.propTypes = {
    updateTypeConfig: PropTypes.func.isRequired,
    typeConfig: PropTypes.object.isRequired,
};

export default TypeConfig;
