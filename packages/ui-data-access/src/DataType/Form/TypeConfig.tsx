import React from 'react';
import PropTypes from 'prop-types';
import { Segment, Header } from 'semantic-ui-react';
import { AnyObject } from '@terascope/utils';
import AddField from './AddField';
import ExistingField from './ExistingField';
import { parseTypeConfig } from './utils';

const TypeConfig: React.FC<Props> = ({ updateTypeConfig, typeConfig = {} }) => {
    const entries = parseTypeConfig(typeConfig);
    return (
        <Segment.Group className="daFormGroup">
            <Header as="h5" block attached="top">
                Type Configuration
            </Header>
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
        </Segment.Group>
    );
};

type Props = {
    updateTypeConfig: (field: string, type: any) => void;
    typeConfig: AnyObject;
};

TypeConfig.propTypes = {
    updateTypeConfig: PropTypes.func.isRequired,
    typeConfig: PropTypes.object.isRequired,
};

export default TypeConfig;
