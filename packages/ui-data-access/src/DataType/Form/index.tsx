import React from 'react';
import PropTypes from 'prop-types';
import { Form } from 'semantic-ui-react';
import ModelForm, { FormInput, ClientID, Description } from '../../ModelForm';
import { validateTypeConfig } from './utils';
import { Input } from '../interfaces';
import TypeConfig from './TypeConfig';
import config from '../config';

const DataTypeForm: React.FC<Props> = ({ id }) => {
    return (
        <ModelForm<Input>
            modelName={config.name}
            id={id}
            validate={(errs, model) => {
                if (!validateTypeConfig(model.type_config)) {
                    errs.messages.push('Invalid Type Config');
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
                                client_id={model.client_id}
                            />
                        </Form.Group>
                        <Description<Input>
                            {...defaultInputProps}
                            description={model.description}
                        />
                        <TypeConfig
                            updateTypeConfig={(field, type) => {
                                const typeConfig = { ...model.type_config };
                                Object.assign(typeConfig, {
                                    [field]: type,
                                });
                                updateModel({
                                    type_config: typeConfig,
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
