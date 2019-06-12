import React from 'react';
import PropTypes from 'prop-types';
import { trim, toInteger } from '@terascope/utils';
import { Form } from 'semantic-ui-react';
import ModelForm, { FormInput, ClientID, Description } from '../../ModelForm';
import { validateFieldName, parseTypeConfig } from '../../utils';
import { Input, availableDataTypes } from '../interfaces';
import TypeConfig from './TypeConfig';
import config from '../config';

const DataTypeForm: React.FC<Props> = ({ id }) => {
    return (
        <ModelForm<Input>
            modelName={config.name}
            id={id}
            validate={(errs, model) => {
                const typeVersion = toInteger(model.type_config.version);
                if (!typeVersion) {
                    errs.messages.push('Invalid Type Config version');
                }
                const types = parseTypeConfig(model.type_config);
                for (const { field, type } of types) {
                    if (!validateFieldName(field)) {
                        if (field) {
                            errs.messages.push(`Invalid field name "${field}"`);
                        } else {
                            errs.messages.push('Empty fields not allowed');
                        }
                    }

                    if (type && !availableDataTypes.includes(type)) {
                        let msg = `Invalid field type "${type}"`;
                        if (field) msg += ` for field "${field}"`;
                        errs.messages.push(msg);
                    }

                    const fieldCount = types.reduce(
                        (count, { field: _field }) => {
                            if (trim(_field) === trim(field)) return count + 1;
                            return count;
                        },
                        0
                    );
                    if (fieldCount !== 1) {
                        errs.messages.push('Duplicate fields not allowed');
                    }
                }
                return errs;
            }}
        >
            {({ defaultInputProps, updateModel, model }) => {
                return (
                    <React.Fragment>
                        <Form.Group>
                            <FormInput<Input>
                                {...defaultInputProps}
                                value={model.name}
                                name="name"
                                label="Name"
                            />
                            <ClientID<Input>
                                {...defaultInputProps}
                                id={model.client_id}
                            />
                        </Form.Group>
                        <Description<Input>
                            {...defaultInputProps}
                            description={model.description}
                        />
                        <TypeConfig
                            updateTypeConfig={typeConfig => {
                                updateModel({
                                    type_config: {
                                        ...model.type_config,
                                        ...typeConfig,
                                    },
                                });
                            }}
                            typeConfig={model.type_config}
                        />
                    </React.Fragment>
                );
            }}
        </ModelForm>
    );
};

type Props = {
    id?: string;
};

DataTypeForm.propTypes = {
    id: PropTypes.string,
};

export default DataTypeForm;
