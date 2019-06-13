import React from 'react';
import PropTypes from 'prop-types';
import { Segment } from 'semantic-ui-react';
import { Section, Code } from '@terascope/ui-components';
import {
    DataTypeConfig,
    AvailableTypes,
    AvailableType,
    AvailableVersions,
} from '@terascope/data-types';
import { parseTypeConfig } from '../../utils';
import ExistingField from './ExistingField';
import AddField from './AddField';

const TypeConfig: React.FC<Props> = ({ updateTypeConfig, typeConfig }) => {
    const entries = parseTypeConfig(typeConfig);
    const updateField = (field: string, type: AvailableType | false) => {
        const fields = { ...typeConfig.fields };
        if (type === false) {
            delete fields[field];
        } else {
            fields[field] = { type };
        }

        updateTypeConfig({
            version: typeConfig.version,
            fields,
        });
    };

    return (
        <Section
            title="Type Configuration"
            description={
                <div style={{ textAlign: 'right' }}>
                    Data Types Version:&nbsp;
                    <strong>{typeConfig.version}</strong>
                </div>
            }
            info={
                <span>
                    Use dot notation to specify nested properties, e.g. &nbsp;
                    <Code inline>example.field</Code>
                </span>
            }
        >
            {entries.length ? (
                entries.map(({ field, type }, i) => {
                    const key = `data-type-config-${field}-${i}`;
                    return (
                        <ExistingField
                            key={key}
                            updateField={updateField}
                            field={field}
                            type={type}
                        />
                    );
                })
            ) : (
                <Segment textAlign="center" className="daFieldEmptyMessage">
                    Add field and type configuration below
                </Segment>
            )}
            <AddField
                addField={updateField}
                fields={Object.keys(typeConfig.fields)}
            />
        </Section>
    );
};

type Props = {
    updateTypeConfig: (typeConfig: DataTypeConfig) => void;
    typeConfig: DataTypeConfig;
};

TypeConfig.propTypes = {
    updateTypeConfig: PropTypes.func.isRequired,
    typeConfig: PropTypes.shape({
        version: PropTypes.oneOf(AvailableVersions).isRequired,
        fields: PropTypes.objectOf(
            PropTypes.shape({
                type: PropTypes.oneOf(AvailableTypes).isRequired,
                array: PropTypes.bool,
            }).isRequired
        ).isRequired,
    }).isRequired,
};

export default TypeConfig;
