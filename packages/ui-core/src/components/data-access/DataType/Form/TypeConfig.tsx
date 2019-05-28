import React from 'react';
import PropTypes from 'prop-types';
import { Segment, Header } from 'semantic-ui-react';
import { AnyObject } from '@terascope/utils';
import AddField from './AddField';
import ExistingField from './ExistingField';

const TypeConfig: React.FC<Props> = ({ updateTypeConfig, typeConfig = {} }) => {
    const entries = getEntries(typeConfig);
    return (
        <Segment.Group className="daFieldValueGroup">
            <Header as="h5" block attached="top">
                Type Configuration
            </Header>
            {entries.length ? (
                entries.map(([field, type], i) => {
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
            <Header as="h5" block attached="top" sub>
                Add additional type definition for field
            </Header>
            <AddField add={updateTypeConfig} />
        </Segment.Group>
    );
};

function getEntries(typeConfig: AnyObject): ([string, any])[] {
    if (!typeConfig) return [];
    return Object.entries(typeConfig).filter(([field, type]) => !!type);
}

type Props = {
    updateTypeConfig: (field: string, type: any) => void;
    typeConfig: AnyObject;
};

TypeConfig.propTypes = {
    updateTypeConfig: PropTypes.func.isRequired,
    typeConfig: PropTypes.object.isRequired,
};

export default TypeConfig;
