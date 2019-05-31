import React from 'react';
import PropTypes from 'prop-types';
import { Form } from 'semantic-ui-react';
import ModelForm, { FormInput, FormSelect, ClientID } from '../../ModelForm';
import config from '../config';
import { Input } from '../interfaces';
import { mapForeignRef } from '../../ModelForm/utils';

const SpaceForm: React.FC<Props> = ({ id }) => {
    return (
        <ModelForm<Input>
            modelName={config.name}
            id={id}
            validate={errs => errs}
            beforeSubmit={input => {
                input.roles = mapForeignRef(input.roles);
                input.data_type = mapForeignRef(input.data_type);
                input.views = mapForeignRef(input.views);
                return { input };
            }}
        >
            {({ defaultInputProps, model, roles, dataTypes }) => {
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
                        <Form.Group>
                            <FormInput<Input>
                                {...defaultInputProps}
                                value={model.endpoint}
                                name="endpoint"
                                label="API Endpoint"
                            />
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
                        <Form.Group>
                            <FormSelect<Input>
                                {...defaultInputProps}
                                name="roles"
                                label="Roles"
                                placeholder="Select Roles"
                                multiple
                                value={model.roles}
                                options={roles}
                            />
                            <FormSelect<Input>
                                {...defaultInputProps}
                                name="views"
                                label="Views"
                                placeholder="Select Views"
                                multiple
                                value={model.views}
                                options={model.data_type.views}
                            />
                        </Form.Group>
                        <Form.Group>
                            <FormSelect<Input>
                                {...defaultInputProps}
                                name="data_type"
                                label="Data Type"
                                placeholder="Select Data Type"
                                value={model.data_type}
                                options={dataTypes}
                            />
                        </Form.Group>
                    </React.Fragment>
                );
            }}
        </ModelForm>
    );
};

type Props = {
    id?: string;
};

SpaceForm.propTypes = {
    id: PropTypes.string,
};

export default SpaceForm;
