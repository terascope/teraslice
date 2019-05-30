import React from 'react';
import PropTypes from 'prop-types';
import { Form } from 'semantic-ui-react';
import { useCoreContext } from '@terascope/ui-components';
import ModelForm, { FormInput, FormSelect } from '../../ModelForm';
import config from '../config';
import { Input } from '../interfaces';

const SpaceForm: React.FC<Props> = ({ id }) => {
    const authUser = useCoreContext().authUser!;

    return (
        <ModelForm<Input>
            modelName={config.name}
            id={id}
            validate={errs => errs}
            beforeSubmit={(model, create) => {
                const input = { ...model };
                if (create) {
                    delete input.id;
                }
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
                                value={model.roles}
                                options={roles}
                            />
                            <FormSelect<Input>
                                {...defaultInputProps}
                                name="views"
                                label="Views"
                                placeholder="Select Views"
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
