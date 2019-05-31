import React from 'react';
import PropTypes from 'prop-types';
import { Form } from 'semantic-ui-react';
import ModelForm, {
    ValidateFn,
    FormInput,
    FormSelect,
    ClientID,
    mapForeignRef,
    Description,
    FormCheckbox,
} from '../../ModelForm';
import Fields from './Fields';
import config from '../config';
import { Input } from '../interfaces';
import { validateFields } from './utils';

const ViewForm: React.FC<Props> = ({ id }) => {
    const validate: ValidateFn<Input> = (errs, model) => {
        if (validateFields(model.excludes)) {
            errs.messages.push('Invalid Excludes');
        }
        if (validateFields(model.includes)) {
            errs.messages.push('Invalid Includes');
        }
        return errs;
    };

    return (
        <ModelForm<Input>
            modelName={config.name}
            id={id}
            validate={validate}
            beforeSubmit={input => {
                input.roles = mapForeignRef(input.roles);
                input.data_type = mapForeignRef(input.data_type);
                input.prevent_prefix_wildcard = Boolean(
                    input.prevent_prefix_wildcard
                );
                delete input.space;
                return { input };
            }}
        >
            {({ defaultInputProps, updateModel, model, dataTypes }) => {
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
                        <Form.Group>
                            <FormSelect<Input>
                                {...defaultInputProps}
                                name="roles"
                                label="Roles"
                                placeholder="Select Roles"
                                multiple
                                value={model.roles}
                                options={model.space.roles}
                            />
                            <FormSelect<Input>
                                {...defaultInputProps}
                                name="data_type"
                                label="Data Type"
                                disabled={Boolean(id)}
                                placeholder="Select Data Type"
                                value={model.data_type}
                                options={dataTypes}
                            />
                        </Form.Group>
                        <Form.Group>
                            <FormCheckbox<Input>
                                {...defaultInputProps}
                                value={model.prevent_prefix_wildcard}
                                name="prevent_prefix_wildcard"
                                label="Prevent Prefix Wildcard"
                            />
                            <FormInput<Input>
                                {...defaultInputProps}
                                value={model.constraint}
                                name="constraint"
                                label="Search Query Constraint"
                            />
                        </Form.Group>
                        <Fields
                            label="Restricted Fields (inclusive)"
                            description="A whitelist of fields that can be views and searched"
                            update={includes => {
                                updateModel({ includes });
                            }}
                            fields={model.includes!}
                        />
                        <Fields
                            label="Restricted Fields (exclusive)"
                            description="A blacklist of fields that can be views and searched"
                            update={excludes => {
                                updateModel({ excludes });
                            }}
                            fields={model.excludes!}
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

ViewForm.propTypes = {
    id: PropTypes.string,
};

export default ViewForm;
