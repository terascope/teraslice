import React from 'react';
import PropTypes from 'prop-types';
import { Segment, Header } from 'semantic-ui-react';
import AddField from './AddField';
import ExistingField from './ExistingField';

const Fields: React.FC<Props> = ({ fields = [], addField, removeField }) => {
    return (
        <Segment.Group className="daFieldValueGroup">
            <Header as="h5" block attached="top">
                Field Configuration
            </Header>
            {fields.length ? (
                fields.map((field, i) => {
                    const key = `data-type-config-${field}-${i}`;
                    return (
                        <ExistingField
                            key={key}
                            removeField={removeField}
                            field={field}
                        />
                    );
                })
            ) : (
                <Segment textAlign="center" className="daFieldEmptyMessage">
                    Add field below
                </Segment>
            )}
            <AddField addField={addField} />
        </Segment.Group>
    );
};

type Props = {
    addField: (field: string) => void;
    removeField: (field: string) => void;
    fields: string[];
};

Fields.propTypes = {
    addField: PropTypes.func.isRequired,
    removeField: PropTypes.func.isRequired,
    fields: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
};

export default Fields;
