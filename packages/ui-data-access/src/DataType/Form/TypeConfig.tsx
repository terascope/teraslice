import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Segment, Label, Icon } from 'semantic-ui-react';
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
import ResolvedField from './ResolvedField';

const TypeConfig: React.FC<Props> = ({
    updateTypeConfig,
    typeConfig,
    resolvedConfig,
}) => {
    const [showResolved, setShowResolved] = useState(false);

    const existingFields = Object.keys(typeConfig.fields);
    const existing = parseTypeConfig(typeConfig);
    const resolved = parseTypeConfig(resolvedConfig);

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
                <React.Fragment>
                    <div style={{ textAlign: 'left' }}>
                        <Label
                            basic
                            onClick={e => {
                                e.preventDefault();
                                setShowResolved(bool => !bool);
                            }}
                        >
                            <Icon name={showResolved ? 'eye slash' : 'eye'} />
                            {showResolved ? 'Hide' : 'Show'} Inherited Fields
                        </Label>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        Data Types Version:&nbsp;
                        <strong>{typeConfig.version}</strong>
                    </div>
                </React.Fragment>
            }
            info={
                <span>
                    Use dot notation to specify nested properties, e.g. &nbsp;
                    <Code inline>example.field</Code>
                </span>
            }
        >
            {showResolved &&
                resolved.map(({ field, type }) => (
                    <ResolvedField
                        key={`resolved-${field}`}
                        field={field}
                        type={type}
                    />
                ))}
            {existing.length ? (
                existing.map(({ field, type }) => (
                    <ExistingField
                        key={`existing-${field}`}
                        updateField={updateField}
                        field={field}
                        type={type}
                    />
                ))
            ) : (
                <Segment textAlign="center" className="daFieldEmptyMessage">
                    Add field and type configuration below
                </Segment>
            )}
            <AddField addField={updateField} fields={existingFields} />
        </Section>
    );
};

type Props = {
    updateTypeConfig: (typeConfig: DataTypeConfig) => void;
    typeConfig: DataTypeConfig;
    resolvedConfig: DataTypeConfig;
};

const TypeConfigProp = PropTypes.shape({
    version: PropTypes.oneOf(AvailableVersions).isRequired,
    fields: PropTypes.objectOf(
        PropTypes.shape({
            type: PropTypes.oneOf(AvailableTypes).isRequired,
            array: PropTypes.bool,
        }).isRequired
    ).isRequired,
}).isRequired;

TypeConfig.propTypes = {
    updateTypeConfig: PropTypes.func.isRequired,
    resolvedConfig: TypeConfigProp,
    typeConfig: TypeConfigProp,
};

export default TypeConfig;
