import React from 'react';
import PropTypes from 'prop-types';
import { Segment } from 'semantic-ui-react';
import { Section, Code } from '@terascope/ui-components';
import AddField from './AddField';
import ExistingField from './ExistingField';
import { parseTypeConfig } from '../../utils';

const TypeConfig: React.FC<Props> = ({ updateTypeConfig, typeConfig = {} }) => {
    const entries = parseTypeConfig(typeConfig);
    return (
        <Section
            title="Type Configuration"
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
                            updateTypeConfig={updateTypeConfig}
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
            <AddField add={updateTypeConfig} />
        </Section>
    );
};

type Props = {
    updateTypeConfig: (field: string, type: any) => void;
    typeConfig: TypeConfig;
};

TypeConfig.propTypes = {
    updateTypeConfig: PropTypes.func.isRequired,
    typeConfig: PropTypes.object.isRequired,
};

export default TypeConfig;
