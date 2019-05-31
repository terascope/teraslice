import React from 'react';
import PropTypes from 'prop-types';
import { Form } from 'semantic-ui-react';
import { useCoreContext } from '@terascope/ui-components';
import ModelForm, { FormInput } from '../../ModelForm';
import TypeConfig from './TypeConfig';
import config from '../config';
import { validateTypeConfig } from './utils';
import { Input } from '../interfaces';

const DataTypeForm: React.FC<Props> = ({ id }) => {
    const authUser = useCoreContext().authUser!;

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
                            {authUser.type === 'SUPERADMIN' && (
                                <FormInput<Input>
                                    {...defaultInputProps}
                                    value={`${model.client_id}`}
                                    name="client_id"
                                    label="Client ID"
                                />
                            )}
                        </Form.Group>
                        <Form.Group>
                            <FormInput<Input>
                                {...defaultInputProps}
                                as={Form.TextArea}
                                name="description"
                                label="Description"
                                value={model.description}
                                width={8}
                            />
                        </Form.Group>
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
