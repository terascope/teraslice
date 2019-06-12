import React from 'react';
import PropTypes from 'prop-types';
import { Segment } from 'semantic-ui-react';
import { AnyObject } from '@terascope/utils';
import { Section, Code } from '@terascope/ui-components';
import { parseTypeConfig } from '../../utils';
import ExistingField from './ExistingField';
import AddField from './AddField';

const TypeConfig: React.FC<Props> = ({ updateTypeConfig, typeConfig = {} }) => {
    const entries = parseTypeConfig(typeConfig);
    const updateField = (field: string, type: string | false) => {
        const fields = { ...typeConfig.fields };
        if (type === false) {
            delete fields[field];
        } else {
            fields[field] = type;
        }

        updateTypeConfig({
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
            {/* <Form.Group as={Segment} basic className="daTypeConfigVersion">
                <FormSelect<any>
                    onChange={(e, { value }) => {
                        e.preventDefault();
                        updateTypeConfig({
                            version: toNumber(value),
                        });
                    }}
                    width={6}
                    compact
                    hasError={() => false}
                    isRequired={() => true}
                    name="version"
                    label="Type Version"
                    placeholder="Select Type Configuration Version"
                    value={`${typeConfig.version}`}
                    options={dataTypeVersions}
                />
            </Form.Group> */}
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
            <AddField addField={updateField} />
        </Section>
    );
};

type Props = {
    updateTypeConfig: (typeConfig: AnyObject) => void;
    typeConfig: AnyObject;
};

TypeConfig.propTypes = {
    updateTypeConfig: PropTypes.func.isRequired,
    typeConfig: PropTypes.object.isRequired,
};

export default TypeConfig;
